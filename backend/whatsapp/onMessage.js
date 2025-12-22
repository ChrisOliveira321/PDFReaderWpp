import fs from "fs";
import path from "path";
import { isPdf } from "../utils/fileValidator.js";
import { extrairDadosCRLV } from "../services/crlvExtractor.js";
import { insertCrlv, updateCrlv, markAsErro } from "../repositories/crlvRepository.js";

const DOWNLOAD_DIR = path.join(process.cwd(), "pdfs");
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR);

export async function onMessage(msg) {
    let filePath = null;
    let registroId = null;

    try {
        if (!msg.hasMedia && msg.type !== "document") return;

        const media = await msg.downloadMedia();
        if (!media || !media.data) return;
        if (!isPdf(media)) return;

        // Salva PDF
        const pdfBuffer = Buffer.from(media.data, "base64");
        const fileName = `crlv_${Date.now()}.pdf`;
        filePath = path.join(DOWNLOAD_DIR, fileName);
        fs.writeFileSync(filePath, pdfBuffer);

        // Cria registro inicial
        registroId = insertCrlv(filePath);

        // Extração via Python
        const dados = await extrairDadosCRLV(filePath);

        // Atualiza banco
        updateCrlv(registroId, dados);

    } catch (err) {
        console.error("Erro ao processar documento:", err);
        if (registroId) markAsErro(registroId);
    }
}
