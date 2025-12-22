const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const db = require("./db");

// ===================================================
// 🔒 SEGURANÇA — NUNCA ENVIAR MENSAGENS NO WHATSAPP
// ===================================================
const ENVIAR_RESPOSTAS_WHATSAPP = false;

async function responder(msg, texto) {
    if (!ENVIAR_RESPOSTAS_WHATSAPP) return;
    await msg.reply(texto);
}

// ---------------------------------------------------
// Pasta onde os PDFs serão salvos
// ---------------------------------------------------
const DOWNLOAD_DIR = path.join(__dirname, "pdfs");
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR);

// ---------------------------------------------------
// isPdf DEFINITIVO (WhatsApp-safe / produção)
// ---------------------------------------------------
function isPdf(media) {
    if (!media || !media.data) return false;

    if (media.mimetype && /pdf/i.test(media.mimetype)) return true;
    if (media.filename && media.filename.toLowerCase().endsWith(".pdf")) return true;

    const buf = Buffer.from(media.data, "base64");
    const header = buf.slice(0, 1024).toString("latin1");

    return header.includes("%PDF");
}

// ---------------------------------------------------
// Executa o Python para extrair dados do CRLV
// ---------------------------------------------------
function extrairDadosCRLV(caminhoPDF) {
    return new Promise((resolve, reject) => {
        const processo = spawn("python3", [
            path.join(__dirname, "extrair_crlv.py"),
            path.resolve(caminhoPDF)
        ]);

        let stdout = "";
        let stderr = "";

        processo.stdout.on("data", d => stdout += d.toString("utf8"));
        processo.stderr.on("data", d => stderr += d.toString("utf8"));

        processo.on("close", code => {
            if (code !== 0) {
                return reject(stderr || "Erro no Python");
            }

            try {
                const jsonLimpo = stdout.replace(/^\uFEFF/, "").trim();
                resolve(JSON.parse(jsonLimpo));
            } catch (e) {
                reject("Erro ao parsear JSON: " + e.message);
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

// QR Code (APENAS CONSOLE)
client.on("qr", qr => {
    console.log("\nJarvis: Escaneie o QR Code:\n");
    qrcode.generate(qr, { small: true });
});

// Ready
client.on("ready", () => {
    console.log("Jarvis: Sistema online.");
    console.log("Jarvis: Monitorando mensagens (MODO SILENCIOSO).\n");
});

// ---------------------------------------------------
// Evento principal
// ---------------------------------------------------
client.on("message", async (msg) => {
    let filePath = null;
    let registroId = null;

    try {
        const hasArquivo =
            msg.hasMedia ||
            msg.type === "document" ||
            msg._data?.mediaKey;

        if (!hasArquivo) return;

        const media = await msg.downloadMedia();
        if (!media || !media.data) return;

        if (!isPdf(media)) return;

        // ---------------------------------------------------
        // Salva PDF
        // ---------------------------------------------------
        const pdfBuffer = Buffer.from(media.data, "base64");
        const fileName = `crlv_${Date.now()}.pdf`;
        filePath = path.join(DOWNLOAD_DIR, fileName);
        fs.writeFileSync(filePath, pdfBuffer);

        // ---------------------------------------------------
        // Cria registro inicial
        // ---------------------------------------------------
        const info = db.prepare(`
            INSERT INTO crlv (pdf_path, status)
            VALUES (?, ?)
        `).run(filePath, "novo");

        registroId = info.lastInsertRowid;

        // ---------------------------------------------------
        // Extração via Python
        // ---------------------------------------------------
        const dados = await extrairDadosCRLV(filePath);

        // ---------------------------------------------------
        // Atualiza banco (COM JSON COMPLETO)
        // ---------------------------------------------------
        db.prepare(`
            UPDATE crlv SET
                exercicio = ?,
                ano_fabricacao = ?,
                ano_modelo = ?,

                placa = ?,
                renavam = ?,
                numero_crv = ?,
                codigo_seguranca_cla = ?,

                chassi = ?,
                cor_predominante = ?,

                nome_proprietario = ?,
                local = ?,

                dados_extraidos_json = ?,
                status = ?
            WHERE id = ?
        `).run(
            dados.exercicio ?? null,
            dados.ano_fabricacao ?? null,
            dados.ano_modelo ?? null,

            dados.placa ?? null,
            dados.renavam ?? null,
            dados.numero_crv ?? null,
            dados.codigo_seguranca_cla ?? null,

            dados.chassi ?? null,
            dados.cor_predominante ?? null,

            dados.nome_proprietario ?? null,
            dados.local ?? null,

            JSON.stringify(dados),
            "processado",
            registroId  
        );

    } catch (err) {
        console.error("Erro ao processar documento:", err);

        if (registroId) {
            db.prepare(`
                UPDATE crlv SET status = ?
                WHERE id = ?
            `).run("erro", registroId);
        }
    }
});

// Inicializa
client.initialize();
