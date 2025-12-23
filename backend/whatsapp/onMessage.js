import fs from "fs";
import path from "path";

import { isPdf } from "../utils/pdfValidator.js";
import { isCRLV } from "../utils/crlvValidator.js";
import { extractTextFromPdfBase64 } from "../utils/pdfTextExtractor.js"; // ES Modules
import { extrairDadosCRLV } from "../services/crlvExtractor.js";
import { insertCrlv, updateCrlv, markAsErro } from "../repositories/crlvRepository.js";

const DOWNLOAD_DIR = path.join(process.cwd(), "pdfs");
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR);

export async function onMessage(msg) {
  let filePath = null;
  let registroId = null;

  try {
    // 🔹 Ignora mensagens sem mídia ou documentos
    if (!msg.hasMedia && msg.type !== "document") return;

    // 🔹 Baixa mídia
    const media = await msg.downloadMedia();
    if (!media || !media.data) return;

    // 🔹 Valida se é PDF
    if (!isPdf(media)) {
      console.log("❌ Ignorado: não é PDF");
      return;
    }

    console.log("📄 PDF recebido, extraindo texto...");

    // 🔹 Extração de texto usando pdfjs-dist
    const textoExtraido = await extractTextFromPdfBase64(media.data);

    // 🔹 Verifica se parece CRLV
    if (!isCRLV(textoExtraido, true)) {
      console.log("❌ PDF não parece CRLV");
      return;
    }

    console.log("✅ PDF válido e parece CRLV");

    // 🔹 Salva PDF localmente
    const pdfBuffer = Buffer.from(media.data, "base64");
    const fileName = `crlv_${Date.now()}.pdf`;
    filePath = path.join(DOWNLOAD_DIR, fileName);
    fs.writeFileSync(filePath, pdfBuffer);
    console.log(`💾 PDF salvo em: ${filePath}`);

    // 🔹 Cria registro no banco
    registroId = insertCrlv(filePath);

    console.log("🔍 Extração completa via Python em andamento...");
    const dados = await extrairDadosCRLV(filePath);

    // 🔹 Atualiza registro com os dados extraídos
    updateCrlv(registroId, dados);

    console.log("✅ Registro atualizado com sucesso");

  } catch (err) {
    console.error("❌ Erro ao processar documento:", err);
    if (registroId) markAsErro(registroId);
  }
}
