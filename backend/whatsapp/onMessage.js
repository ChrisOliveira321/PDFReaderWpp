import fs from "fs";
import path from "path";

import { isPdf } from "../utils/pdfValidator.js";
import { isCRLV } from "../utils/crlvValidator.js";
import { extractTextFromPdfBase64 } from "../utils/pdfTextExtractor.js";
import { extrairDadosCRLV } from "../services/crlvExtractor.js";
import { validarCrlv } from "../utils/crlvValidator.js";
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

    const textoExtraido = await extractTextFromPdfBase64(media.data);

    if (!isCRLV(textoExtraido, true)) return;

    const pdfBuffer = Buffer.from(media.data, "base64");
    const fileName = `crlv_${Date.now()}.pdf`;
    filePath = path.join(DOWNLOAD_DIR, fileName);
    fs.writeFileSync(filePath, pdfBuffer);

    registroId = insertCrlv(filePath);

    const dadosExtraidos = await extrairDadosCRLV(filePath);
    const dadosValidados = validarCrlv(dadosExtraidos);

    console.log(
      "DEBUG FINAL:",
      dadosValidados.exercicio,
      dadosValidados.status
    );

    updateCrlv(registroId, dadosValidados);

  } catch (err) {
    console.error("❌ Erro ao processar documento:", err);
    if (registroId) markAsErro(registroId);
  }
}
