const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const db = require("./db"); // 🔥 BANCO DE DADOS

// ---------------------------------------------------
// Pasta onde os PDFs serão salvos
// ---------------------------------------------------
const DOWNLOAD_DIR = path.join(__dirname, "pdfs");
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR);

// ---------------------------------------------------
// Verifica se o arquivo é PDF
// ---------------------------------------------------
function isPdf(media) {
    if (!media) return false;

    if (media.mimetype && /pdf/i.test(media.mimetype)) return true;
    if (media.filename && media.filename.toLowerCase().endsWith(".pdf")) return true;

    if (media.data) {
        const buf = Buffer.from(media.data, "base64");
        const peek = buf.slice(0, 4).toString("utf8");
        if (peek.startsWith("%PDF")) return true;
    }

    return false;
}

// ---------------------------------------------------
// Executa o Python para extrair dados do CRLV
// ---------------------------------------------------
function extrairDadosCRLV(caminhoPDF) {
    return new Promise((resolve, reject) => {
        const processo = spawn("python3", ["extrair_crlv.py", caminhoPDF]);

        let saida = "";
        let erro = "";

        processo.stdout.on("data", (data) => (saida += data.toString()));
        processo.stderr.on("data", (data) => (erro += data.toString()));

        processo.on("close", (code) => {
            if (code !== 0) {
                return reject("Erro no Python: " + erro);
            }

            try {
                resolve(JSON.parse(saida));
            } catch (e) {
                reject("Erro ao converter JSON: " + e);
            }
        });
    });
}

// ---------------------------------------------------
// Cliente WhatsApp
// ---------------------------------------------------
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    }
});

// QR Code
client.on("qr", (qr) => {
    console.log("\nJarvis: Escaneie o QR Code, senhor:\n");
    qrcode.generate(qr, { small: true });
});

// Ready
client.on("ready", () => {
    console.log("Jarvis: Sistema online, senhor.");
    console.log("Jarvis: Monitorando mensagens...\n");
});

// ---------------------------------------------------
// Evento principal — Recebimento de mensagem
// ---------------------------------------------------
client.on("message", async (msg) => {
    let filePath = null;
    let registroId = null;

    try {
        console.clear();
        console.log("===== JARVIS ONLINE — MONITORANDO WHATSAPP =====\n");

        // ---------- Nome do contato ----------
        let nome = msg.from;
        try {
            const chat = await msg.getChat();
            nome =
                chat?.contact?.pushname ||
                chat?.contact?.name ||
                chat?.contact?.number ||
                msg.from;
        } catch {}

        console.log(`Jarvis: Nova mensagem de ${nome}, senhor.`);

        // ---------- Ignora mensagens sem mídia ----------
        if (!msg.hasMedia) {
            console.log("Jarvis: Mensagem sem anexos.");
            return;
        }

        console.log("Jarvis: Baixando arquivo...");
        const media = await msg.downloadMedia();

        if (!media) {
            console.log("Jarvis: Falha ao baixar mídia.");
            return;
        }

        console.log("Jarvis: Analisando arquivo...");

        if (!isPdf(media)) {
            console.log("Jarvis: Arquivo não é PDF.");
            return;
        }

        console.log("Jarvis: PDF identificado.");

        // ---------- Salva PDF ----------
        const pdfBuffer = Buffer.from(media.data, "base64");
        const fileName = `crlv_${Date.now()}.pdf`;
        filePath = path.join(DOWNLOAD_DIR, fileName);

        fs.writeFileSync(filePath, pdfBuffer);
        console.log("Jarvis: PDF salvo em:", filePath);

        // ---------- Insere registro inicial com status 'novo' ----------
        const stmtNovo = db.prepare(`
            INSERT INTO crlv (pdf_path, status)
            VALUES (?, ?)
        `);
        const infoNovo = stmtNovo.run(filePath, "novo");
        registroId = infoNovo.lastInsertRowid;

        console.log(`Jarvis: Registro criado no banco com ID ${registroId} e status 'novo'.`);

        // ---------- Extrai dados ----------
        console.log("Jarvis: Executando extração via Python...");
        const dados = await extrairDadosCRLV(filePath);

        console.log("Jarvis: Dados extraídos:", dados);

        // ---------- Atualiza registro com dados e status 'processado' ----------
        db.prepare(`
            UPDATE crlv
            SET placa = ?, cpf_cnpj = ?, renavam = ?, status = ?
            WHERE id = ?
        `).run(
            dados.placa || null,
            dados.cpf_cnpj || null,
            dados.renavam || null,
            "processado",
            registroId
        );

        console.log(`Jarvis: Registro ${registroId} atualizado com status 'processado'.`);

        // ---------- Resposta WhatsApp ----------
        let resposta = "Jarvis: Eis os dados extraídos do documento:\n\n";
        resposta += `RENAVAM: *${dados.renavam || "Não encontrado"}*\n`;
        resposta += `PLACA: *${dados.placa || "Não encontrada"}*\n`;
        resposta += `CPF/CNPJ: *${dados.cpf_cnpj || "Não encontrado"}*\n`;

        await msg.reply(resposta);

    } catch (err) {
        console.log("Jarvis: Erro inesperado:", err);

        // ---------- Atualiza status para 'erro' ----------
        if (registroId) {
            db.prepare(`
                UPDATE crlv
                SET status = ?
                WHERE id = ?
            `).run("erro", registroId);
            console.log(`Jarvis: Registro ${registroId} atualizado com status 'erro'.`);
        } else if (filePath) {
            // Caso nem tenha conseguido criar registro
            db.prepare(`
                INSERT INTO crlv (pdf_path, status)
                VALUES (?, ?)
            `).run(filePath, "erro");
        }

        await msg.reply("Jarvis: Não consegui processar o documento, senhor.");
    }
});

// Inicializa o bot
client.initialize();
