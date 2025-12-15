const express = require("express");
const db = require("./db");
const puppeteer = require("puppeteer");

const app = express();

// Pasta pública (painel web)
app.use(express.static("public"));

// ---------------------------------------------------
// Lista todos os CRLVs
// ---------------------------------------------------
app.get("/api/crlv", (req, res) => {
    try {
        const rows = db.prepare("SELECT * FROM crlv ORDER BY id DESC").all();
        res.json(rows);
    } catch (err) {
        console.log("Erro ao buscar registros:", err);
        res.status(500).json({ erro: "Falha ao consultar CRLVs" });
    }
});

// ---------------------------------------------------
// Preenche formulário via Puppeteer
// ---------------------------------------------------
app.get("/api/preencher/:id", async (req, res) => {
    const id = req.params.id;
    const row = db.prepare("SELECT * FROM crlv WHERE id=?").get(id);

    if (!row) return res.json({ erro: "Registro não encontrado" });

    console.log("🚛 Abrindo Fertipar para:", row.placa);

    let browser;

    try {
        browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        await page.goto("https://fertipar.com/formulario");

        // Preenche os campos do formulário
        await page.type("#placa", row.placa || "");
        await page.type("#cpf", row.cpf_cnpj || "");
        await page.type("#renavam", row.renavam || "");

        console.log(`Campos preenchidos para CRLV ID ${id}.`);

        // Aqui você espera o usuário digitar CAPTCHA manualmente
        // ou implementar um await page.click("#enviar") se quiser automatizar

        // Atualiza status para 'enviado'
        db.prepare("UPDATE crlv SET status=? WHERE id=?").run("enviado", id);
        console.log(`Registro ${id} marcado como enviado.`);

        res.json({ ok: true });
    } catch (err) {
        console.log("Erro no Puppeteer:", err);

        // Atualiza status para 'erro'
        db.prepare("UPDATE crlv SET status=? WHERE id=?").run("erro", id);
        console.log(`Registro ${id} marcado como erro.`);

        res.json({ erro: "Falha ao preencher formulário" });
    } finally {
        if (browser) {
            await browser.close();
            console.log("Navegador fechado.");
        }
    }
});

// Inicializa servidor
app.listen(3000, () => {
    console.log("🌐 Painel web no ar: http://localhost:3000");
});

