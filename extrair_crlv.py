import pdfplumber
import re
import json
import sys

def extrair_campos(pdf_path):
    try:
        with pdfplumber.open(pdf_path) as pdf:
            texto = ""
            for page in pdf.pages:
                texto += page.extract_text() + "\n"

        # Normaliza espaços
        texto = re.sub(r"[ ]{2,}", " ", texto)

        dados = {}

        # RENAVAM
        renavam = re.search(r"RENAVAM\s+(\d+)", texto, re.I)
        dados["renavam"] = renavam.group(1) if renavam else None

        # PLACA
        placa = re.search(r"\b([A-Z]{3}[0-9][A-Z0-9][0-9]{2})\b", texto, re.I)
        dados["placa"] = placa.group(1) if placa else None

        # CPF/CNPJ
        cpf = re.search(r"CPF\s*\/\s*CNPJ\s+([\d\.\-\/]+)", texto, re.I)
        dados["cpf_cnpj"] = cpf.group(1) if cpf else None

        return dados

    except Exception as e:
        return {"erro": str(e)}

if __name__ == "__main__":
    pdf_path = sys.argv[1]
    dados = extrair_campos(pdf_path)
    print(json.dumps(dados, ensure_ascii=False))
