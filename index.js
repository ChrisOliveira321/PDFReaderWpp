const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");

// --- pasta pdf (não usada ainda) ---
const DOWNLOAD_DIR = path.join(__dirname, "pdfs");
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR);

// ---------- Detector simples ----------
function isPdf(media) {
    if (!media) return false;

    // mime
    if (media.mimetype && /pdf/i.test(media.mimetype)) return true;

    // filename
    if (media.filename && media.filename.toLowerCase().endsWith(".pdf"))
        return true;

    // magic number
    if (media.data) {
        const buf = Buffer.from(media.data, "base64");
        const peek = buf.slice(0, 4).toString("utf8");
        if (peek.startsWith("%PDF")) return true;
    }

    return false;
}

// ------------------------------------
// Cliente WhatsApp
// ------------------------------------
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    }
});

// QR CODE
client.on("qr", (qr) => {
    console.log("\n🤖 Jarvis: Gerando QR Code para autenticação, Sr. Chris...\n");
    qrcode.generate(qr, { small: true });
});

// READY
client.on("ready", () => {
    console.log("🟢 Jarvis: Sistema online e funcional, Sr. Chris.");
    console.log("🛰️ Jarvis: Monitorando WhatsApp em tempo real...\n");
});

// ------------------------------------
// Nova mensagem
// ------------------------------------
client.on("message", async (msg) => {
    try {
        const autor = msg._data?.notifyName || msg.from || "Contato desconhecido";

        console.log(`\n📩 Jarvis: Nova mensagem recebida de **${autor}**, Sr. Chris.`);

        if (!msg.hasMedia) {
            console.log("📭 Jarvis: A mensagem não contém nenhum anexo, senhor.");
            return;
        }

        console.log("📎 Jarvis: Detectei um anexo, baixando...");

        let media;
        try {
            media = await msg.downloadMedia();
        } catch {
            console.log("⚠️ Jarvis: Houve um problema ao baixar o arquivo, senhor.");
            return;
        }

        if (!media) {
            console.log("⚠️ Jarvis: O arquivo veio vazio, Sr. Chris.");
            return;
        }

        console.log("🔍 Jarvis: Analisando arquivo para PDF...");

        const ehPdf = isPdf(media);

        if (ehPdf) {
            console.log("📄 Jarvis: PDF identificado com sucesso, Sr. Chris!");
        } else {
            console.log("❌ Jarvis: O arquivo não é um PDF, senhor.");
        }

    } catch (err) {
        console.log("⚠️ Jarvis: Detectei uma falha inesperada no sistema:");
        console.log(err);
    }
});

client.initialize();
