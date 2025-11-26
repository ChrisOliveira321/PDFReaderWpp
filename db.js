const Database = require('better-sqlite3');
const db = new Database('crlv.db');

// Cria tabela se não existir
db.prepare(`
    CREATE TABLE IF NOT EXISTS crlv (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        placa TEXT,
        cpf_cnpj TEXT,
        renavam TEXT,
        pdf_path TEXT,
        data_recebido DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'novo'
    )
`).run();

module.exports = db;
