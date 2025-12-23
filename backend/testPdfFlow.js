import fs from "fs";
import path from "path";

import { isPdf } from "./utils/pdfValidator.js";
import { isCRLV } from "./utils/crlvValidator.js";

// simulação TEMPORÁRIA de texto extraído
function textoFakeDoPdf(nomeArquivo) {
  if (nomeArquivo.toLowerCase().includes("crlv")) {
    return `
      CERTIFICADO DE REGISTRO E LICENCIAMENTO DE VEÍCULO
      RENAVAM 123456789
      PLACA ABC1D23
      CÓDIGO DE SEGURANÇA DO CLA 987654
    `;
  }

  return "Contrato de prestação de serviços sem relação com veículo";
}

const pasta = path.resolve("./pdfs_teste");
const arquivos = fs.readdirSync(pasta);

for (const arquivo of arquivos) {
  const filePath = path.join(pasta, arquivo);

  const media = {
    data: fs.readFileSync(filePath).toString("base64"),
    filename: arquivo,
    mimetype: "application/pdf"
  };

  console.log("\n📄 Arquivo:", arquivo);

  // 1️⃣ PDF?
  if (!isPdf(media)) {
    console.log("❌ Não é PDF → ignorar");
    continue;
  }

  console.log("✅ É PDF");

  // 2️⃣ Texto (fake por enquanto)
  const texto = textoFakeDoPdf(arquivo);

  // 3️⃣ Parece CRLV?
  if (!isCRLV(texto, true)) {
  console.log("⚠️ PDF não parece CRLV");
  console.log("👉 no futuro: aplicar OCR");
  continue;
}

  console.log("✅ PDF parece CRLV");
  console.log("👉 pode seguir para extração Python");
}
