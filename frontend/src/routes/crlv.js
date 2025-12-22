const express = require("express");
const router = express.Router();
const db = require("../db");

// --------------------------------------------------
// Lista TODOS os CRLVs com TODOS os campos
// --------------------------------------------------
router.get("/crlv", (req, res) => {
  try {
    const rows = db
      .prepare(`
        SELECT *
        FROM crlv
        ORDER BY data_recebido DESC
      `)
      .all();

    res.json(rows);
  } catch (err) {
    console.error("Erro ao listar CRLVs:", err);
    res.status(500).json({ erro: "Falha ao listar CRLVs" });
  }
});

// --------------------------------------------------
// Retorna UM CRLV completo por ID (opcional, mas recomendado)
// --------------------------------------------------
router.get("/crlv/:id", (req, res) => {
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

module.exports = router;
    