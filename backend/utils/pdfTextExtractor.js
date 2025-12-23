import { execFile } from "child_process";
import path from "path";

export function extractTextFromPdfBase64(base64Data) {
  return new Promise((resolve, reject) => {
    const pythonPath = "python3"; // ou "python" dependendo do seu SO
    const scriptPath = path.resolve("./utils/pdfTextExtractor.py");

    const buffer = Buffer.from(base64Data, "base64");

    // Passa o PDF para o Python via stdin
    const child = execFile(pythonPath, [scriptPath], { encoding: "utf8" }, (error, stdout, stderr) => {
      if (error) return reject(error);
      if (stderr) console.error("Python stderr:", stderr);
      resolve(stdout);
    });

    // Envia PDF para o Python via stdin
    child.stdin.write(buffer);
    child.stdin.end();
  });
}
