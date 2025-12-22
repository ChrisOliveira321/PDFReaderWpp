import WhatsAppPkg from "whatsapp-web.js";
const { Client, LocalAuth } = WhatsAppPkg;

import qrcode from "qrcode-terminal";
import { onMessage } from "./onMessage.js";

export const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: false, args: ["--no-sandbox", "--disable-setuid-sandbox"] }
});

client.on("qr", qr => {
    console.log("\nJarvis: Escaneie o QR Code:\n");
    qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
    console.log("Jarvis: Sistema online. Monitorando mensagens.");
});

client.on("message", onMessage);
