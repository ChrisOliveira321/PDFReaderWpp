export function isCRLV(texto, debug = false) {
  if (debug) {
    console.log("\n🧾 ===== TEXTO EXTRAÍDO DO PDF =====");
    console.log(texto);
    console.log("🧾 ===== FIM DO TEXTO =====\n");
  }

  if (!texto || texto.trim().length < 50) return false;

  const regras = [
    /RENAVAM/i,
    /PLACA/i,
    /CERTIFICADO\s+DE\s+REGISTRO/i,
    /LICENCIAMENTO/i,
    /CÓDIGO\s+DE\s+SEGURANÇA\s+DO\s+CLA/i
  ];

  let score = 0;

  for (const regra of regras) {
    if (regra.test(texto)) score++;
  }

  if (debug) {
    console.log(`🔍 Score CRLV: ${score}/5`);
  }

  return score >= 2;
}
