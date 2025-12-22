import db from "../db.js";

export function insertCrlv(pdfPath) {
    const info = db.prepare(`
        INSERT INTO crlv (pdf_path, status) VALUES (?, ?)
    `).run(pdfPath, "novo");
    return info.lastInsertRowid;
}

export function updateCrlv(id, dados) {
    db.prepare(`
        UPDATE crlv SET
            exercicio = ?,
            ano_fabricacao = ?,
            ano_modelo = ?,
            placa = ?,
            renavam = ?,
            numero_crv = ?,
            codigo_seguranca_cla = ?,
            chassi = ?,
            cor_predominante = ?,
            nome_proprietario = ?,
            local = ?,
            dados_extraidos_json = ?,
            status = ?
        WHERE id = ?
    `).run(
        dados.exercicio ?? null,
        dados.ano_fabricacao ?? null,
        dados.ano_modelo ?? null,
        dados.placa ?? null,
        dados.renavam ?? null,
        dados.numero_crv ?? null,
        dados.codigo_seguranca_cla ?? null,
        dados.chassi ?? null,
        dados.cor_predominante ?? null,
        dados.nome_proprietario ?? null,
        dados.local ?? null,
        JSON.stringify(dados),
        "processado",
        id
    );
}

export function markAsErro(id) {
    db.prepare(`UPDATE crlv SET status = ? WHERE id = ?`).run("erro", id);
}
