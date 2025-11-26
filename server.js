const express = require("express");
const db = require("./db");
const app = express();

app.use(express.static("public")); // pasta onde ficará o painel web

app.get("/api/crlv", (req, res) => {
    const rows = db.prepare("SELECT * FROM crlv ORDER BY id DESC").all();
    res.json(rows);
});

app.listen(3000, () => {
    console.log("🌐 Painel web no ar: http://localhost:3000");
});

const puppeteer = require("puppeteer");

// ...

app.get("/api/preencher/:id", async (req, res) => {
    const id = req.params.id;
    const row = db.prepare("SELECT * FROM crlv WHERE id=?").get(id);

    if (!row) return res.json({ erro: "Registro não encontrado" });

    console.log("🚛 Abrindo Fertipar para:", row.placa);

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto("https://fertipar.com/formulario"); // link real você coloca aqui

    // Campos — exemplo
    await page.type("#placa", row.placa);
    await page.type("#cpf", row.cpf_cnpj);
    await page.type("#renavam", row.renavam);

    // Agora você digita o CAPTCHA manualmente
    // Quando você enviar, ele encerra

    res.json({ ok: true });
});
