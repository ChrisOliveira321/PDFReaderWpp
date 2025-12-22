import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

// 🚨 Como __dirname não existe em ES Module, criamos:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho do banco
const dbPath = path.join(__dirname, "crlv.db");
console.log("🗄️ Banco SQLite em uso:", dbPath);

// Cria conexão
const db = new Database(dbPath);

// Cria tabela CRLV caso não exista
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

// Exporta para ES Module
export default db;
