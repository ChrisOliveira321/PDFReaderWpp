import { spawn } from "child_process";
import path from "path";

export function extrairDadosCRLV(caminhoPDF) {
    return new Promise((resolve, reject) => {
        const processo = spawn("python3", [path.join(process.cwd(), "extrair_crlv.py"), caminhoPDF]);

        let stdout = "";
        let stderr = "";

        processo.stdout.on("data", d => stdout += d.toString("utf8"));
        processo.stderr.on("data", d => stderr += d.toString("utf8"));

        processo.on("close", code => {
            if (code !== 0) return reject(stderr || "Erro no Python");

            try {
                resolve(JSON.parse(stdout.replace(/^\uFEFF/, "").trim()));
            } catch (e) {
                reject("Erro ao parsear JSON: " + e.message);
            }
        });
    });
}
