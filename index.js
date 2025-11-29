const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// --- pasta pdfs ---
const DOWNLOAD_DIR = path.join(__dirname, "pdfs");
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR);

// ---------------------------------------------------
// Função para verificar se o arquivo é um PDF
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
// Função que chama o Python e retorna os dados do PDF
// ---------------------------------------------------
function extrairDadosCRLV(caminhoPDF) {
    return new Promise((resolve, reject) => {
        const processo = spawn("python3", ["extrair_crlv.py", caminhoPDF]);

        let saida = "";
        let erro = "";

        processo.stdout.on("data", (data) => (saida += data.toString()));
        processo.stderr.on("data", (data) => (erro += data.toString()));

        processo.on("close", (code) => {
            if (code !== 0) return reject("Erro ao executar script Python: " + erro);
            try {
                resolve(JSON.parse(saida));
            } catch (e) {
                reject("Falha ao converter JSON retornado pelo Python: " + e);
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

// QR CODE
client.on("qr", (qr) => {
    console.log("\nJarvis: Escaneie o QR Code, senhor:\n");
    qrcode.generate(qr, { small: true });
});

// READY
client.on("ready", () => {
    console.log("Jarvis: Sistema online, senhor.");
    console.log("Jarvis: Monitorando novas mensagens...\n");
});

// ---------------------------------------------------
// Quando chega mensagem
// ---------------------------------------------------
client.on("message", async (msg) => {
    try {
        // limpa console
        console.clear();
        console.log("===== JARVIS ONLINE — MONITORANDO WHATSAPP =====\n");

        // pega o contato com nome salvo
        const contato = await msg.getContact();
        const nome =
            contato.pushname ||
            contato.name ||
            contato.number ||
            msg.from;

        console.log(`Jarvis: Nova mensagem recebida de ${nome}, senhor.`);

        if (!msg.hasMedia) {
            console.log("Jarvis: Mensagem sem anexos.");
            return;
        }

        console.log("Jarvis: Baixando o arquivo...");

        let media;
        try {
            media = await msg.downloadMedia();
        } catch {
            console.log("Jarvis: Falha ao baixar o anexo, senhor.");
            return;
        }

        if (!media) {
            console.log("Jarvis: O arquivo não foi baixado corretamente.");
            return;
        }

        console.log("Jarvis: Analisando arquivo...");

        const ehPdf = isPdf(media);
        if (!ehPdf) {
            console.log("Jarvis: O arquivo não é PDF, descartando.");
            return;
        }

        console.log("Jarvis: PDF identificado, iniciando extração.");

        // --- salvar PDF ---
        const pdfBuffer = Buffer.from(media.data, "base64");
        const fileName = `crlv_${Date.now()}.pdf`;
        const filePath = path.join(DOWNLOAD_DIR, fileName);

        fs.writeFileSync(filePath, pdfBuffer);
        console.log("Jarvis: Arquivo salvo em:", filePath);

        // --- chamar Python ---
        try {
            console.log("Jarvis: Executando análise via Python...");

            const dados = await extrairDadosCRLV(filePath);

            console.log("Jarvis: Extração concluída:");
            console.log(dados);

            let resposta = "Jarvis: Eis os dados extraídos do documento:\n\n";

            resposta += `RENAVAM: *${dados.renavam || "Não encontrado"}*\n`;
            resposta += `PLACA: *${dados.placa || "Não encontrada"}*\n`;
            resposta += `CPF/CNPJ: *${dados.cpf_cnpj || "Não encontrado"}*\n`;

            await msg.reply(resposta);

        } catch (err) {
            console.log("Jarvis: Erro ao processar PDF:", err);
            await msg.reply("Jarvis: Não consegui extrair os dados do PDF, senhor.");
        }

    } catch (err) {
        console.log("Jarvis: Falha inesperada:");
        console.log(err);
    }
});

// Inicializa
client.initialize();
