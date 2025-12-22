const express = require("express");
const cors = require("cors");
const path = require("path");
const { spawn } = require("child_process");
const puppeteer = require("puppeteer");
const db = require("./db");

const app = express();

// --------------------------------------------------
// Middlewares
// --------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --------------------------------------------------
// Executa Python e retorna JSON
// --------------------------------------------------
function extrairDadosCRLV(pdfPath) {
  return new Promise((resolve, reject) => {
    const py = spawn("python3", ["extrair_crlv.py", pdfPath]);

    let out = "";
    let err = "";

    py.stdout.on("data", d => out += d.toString());
    py.stderr.on("data", d => err += d.toString());

    py.on("close", code => {
      if (code !== 0) {
        return reject(err || "Erro desconhecido no Python");
      }
      try {
        resolve(JSON.parse(out));
      } catch (e) {
        reject("Falha ao converter JSON: " + e.message);
      }
    });
  });
}

// --------------------------------------------------
// Lista CRLVs
// --------------------------------------------------
app.get("/api/crlv", (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT *
      FROM crlv
      ORDER BY id DESC
    `).all();

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Falha ao listar CRLVs" });
  }
});

// --------------------------------------------------
// Busca UM CRLV completo por ID
// --------------------------------------------------
app.get("/api/crlv/:id", (req, res) => {
  try {
    const { id } = req.params;

    const row = db
      .prepare("SELECT * FROM crlv WHERE id = ?")
      .get(id);

    if (!row) {
      return res.status(404).json({ erro: "CRLV não encontrado" });
    }

    res.json(row);
  } catch (err) {
    console.error("Erro ao buscar CRLV:", err);
    res.status(500).json({ erro: "Falha ao buscar CRLV" });
  }
});


// --------------------------------------------------
// Processa PDF (Node → Python → DB)
// --------------------------------------------------
app.post("/api/processar", async (req, res) => {
  const { pdf_path } = req.body;

  if (!pdf_path) {
    return res.status(400).json({ erro: "pdf_path obrigatório" });
  }

  let registroId;

  try {
    // Cria registro inicial
    const info = db.prepare(`
      INSERT INTO crlv (pdf_path, status)
      VALUES (?, ?)
    `).run(pdf_path, "processando");

    registroId = info.lastInsertRowid;

    // Executa Python
    const dados = await extrairDadosCRLV(pdf_path);

    // Atualiza banco com JSON completo
    db.prepare(`
      UPDATE crlv SET
        exercicio = ?,
        ano_fabricacao = ?,
        ano_modelo = ?,
        placa = ?,
        renavam = ?,
        numero_crv = ?,
        codigo_seguranca_cla = ?,
        marca_modelo_versao = ?,
        especie_tipo = ?,
        chassi = ?,
        cor_predominante = ?,
        combustivel = ?,
        categoria = ?,
        capacidade = ?,
        potencia_cilindrada = ?,
        peso_bruto_total = ?,
        motor = ?,
        cmt = ?,
        eixos = ?,
        lotacao = ?,
        carroceria = ?,
        nome_proprietario = ?,
        local = ?,
        status = ?
      WHERE id = ?
    `).run(
      dados.exercicio,
      dados.ano_fabricacao,
      dados.ano_modelo,
      dados.placa,
      dados.renavam,
      dados.numero_crv,
      dados.codigo_seguranca_cla,
      dados.marca_modelo_versao,
      dados.especie_tipo,
      dados.chassi,
      dados.cor_predominante,
      dados.combustivel,
      dados.categoria,
      dados.capacidade,
      dados.potencia_cilindrada,
      dados.peso_bruto_total,
      dados.motor,
      dados.cmt,
      dados.eixos,
      dados.lotacao,
      dados.carroceria,
      dados.nome_proprietario,
      dados.local,
      "processado",
      registroId
    );

    res.json({ ok: true, id: registroId });

  } catch (err) {
    console.error("Erro no processamento:", err);

    if (registroId) {
      db.prepare("UPDATE crlv SET status=? WHERE id=?")
        .run("erro", registroId);
    }

    res.status(500).json({ erro: "Falha ao processar CRLV" });
  }
});

// --------------------------------------------------
// Preenche formulário externo (Puppeteer)
// --------------------------------------------------
app.post("/api/preencher/:id", async (req, res) => {
  const { id } = req.params;
  const row = db.prepare("SELECT * FROM crlv WHERE id=?").get(id);

  if (!row) {
    return res.status(404).json({ erro: "Registro não encontrado" });
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null
    });

    const page = await browser.newPage();
    await page.goto("https://fertipar.com/formulario", {
      waitUntil: "networkidle2"
    });

    // -------- Preenchimento --------
    await page.type("#placa", row.placa ?? "");
    await page.type("#renavam", row.renavam ?? "");
    await page.type("#chassi", row.chassi ?? "");
    await page.type("#marcaModelo", row.marca_modelo_versao ?? "");
    await page.type("#combustivel", row.combustivel ?? "");
    await page.type("#categoria", row.categoria ?? "");
    await page.type("#anoModelo", row.ano_modelo ?? "");
    await page.type("#anoFabricacao", row.ano_fabricacao ?? "");

    // -------------------------------
    db.prepare("UPDATE crlv SET status=? WHERE id=?")
      .run("enviado", id);

    res.json({ ok: true });

  } catch (err) {
    console.error("Erro Puppeteer:", err);

    db.prepare("UPDATE crlv SET status=? WHERE id=?")
      .run("erro", id);

    res.status(500).json({ erro: "Falha ao preencher formulário" });

  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// --------------------------------------------------
// Start servidor
// --------------------------------------------------
const PORT = 3001;

app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});
