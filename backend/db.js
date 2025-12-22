const path = require("path");
const Database = require("better-sqlite3");

const dbPath = path.join(__dirname, "crlv.db");

console.log("🗄️ Banco SQLite em uso:", dbPath);

const db = new Database(dbPath);

db.prepare(`
  CREATE TABLE IF NOT EXISTS crlv (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    exercicio TEXT,
    ano_fabricacao TEXT,
    ano_modelo TEXT,

    placa TEXT,
    renavam TEXT,
    numero_crv TEXT,
    codigo_seguranca_cla TEXT,

    marca_modelo_versao TEXT,
    especie_tipo TEXT,
    chassi TEXT,
    cor_predominante TEXT,
    combustivel TEXT,
    categoria TEXT,
    capacidade TEXT,
    potencia_cilindrada TEXT,
    peso_bruto_total TEXT,
    motor TEXT,
    cmt TEXT,
    eixos TEXT,
    lotacao TEXT,
    carroceria TEXT,

    nome_proprietario TEXT,
    local TEXT,

    pdf_path TEXT,
    status TEXT DEFAULT 'novo',
    data_recebido DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

module.exports = db;
