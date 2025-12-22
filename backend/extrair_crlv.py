import pdfplumber
import re
import json
import sys


def limpar(texto):
    texto = texto.replace("\n", " ")
    texto = re.sub(r"\s{2,}", " ", texto)
    return texto.strip()


def extrair(regex, texto, flags=re.I):
    m = re.search(regex, texto, flags)
    return m.group(1).strip() if m else None


def extrair_proximo_numero(rotulo, texto, tamanho_min=4):
    padrao = rf"{rotulo}.*?([0-9]{{{tamanho_min},}})"
    m = re.search(padrao, texto, re.I)
    return m.group(1) if m else None

def extrair_campos(pdf_path):
    try:
        with pdfplumber.open(pdf_path) as pdf:
            texto = ""
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    texto += t + " "

        texto = limpar(texto)

        dados = {}

        print(texto)

        # Exercício
        dados["exercicio"] = extrair(
            r"PLACA\s+EXERCÍCIO\s+[A-Z0-9]+\s+([0-9]{4})",
            texto
        )

        # Ano fabricação / modelo
        dados["ano_fabricacao"] = extrair(
            r"ANO\s+FABRICAÇÃO\s+ANO\s+MODELO\s+([0-9]{4})",
            texto
        )

        dados["ano_modelo"] = extrair(
            r"ANO\s+FABRICAÇÃO\s+ANO\s+MODELO\s+[0-9]{4}\s+([0-9]{4})",
            texto
        )

        # RENAVAM
        dados["renavam"] = extrair_proximo_numero("RENAVAM", texto, 9)

        # Placa
        dados["placa"] = extrair(
            r"\b([A-Z]{3}[0-9][A-Z0-9][0-9]{2})\b",
            texto
        )

        # Número CRV
        dados["numero_crv"] = extrair_proximo_numero("NÚMERO DO CRV", texto, 6)

        # Código segurança CLA
        dados["codigo_seguranca_cla"] = extrair_proximo_numero(
            "CÓDIGO DE SEGURANÇA DO CLA", texto, 6
        )

        # Marca / modelo / versão

        # Espécie / tipo
       
        # Chassi
        dados["chassi"] = extrair(
            r"\b([A-HJ-NPR-Z0-9]{17})\b",
            texto
        )

        #Cor Predominante
        dados["cor_predominante"] = extrair(
            r"\b([A-Z]+)\s+\*\s+\*\s+\*",
            texto
        )

        # Combustível
        """ print(texto)

        COMBUSTIVEIS_VALIDOS = [
            "DIESEL",
            "GASOLINA",
            "ETANOL",
            "FLEX",
            "ELÉTRICO",
            "HIBRIDO",
            "GNV"
        ]

        def extrair_combustivel(texto):
            for c in COMBUSTIVEIS_VALIDOS:
                if re.search(rf"\b{c}\b", texto):
                    return c
            return None

        dados["combustivel"] = extrair_combustivel(texto) """


        # Nome proprietário
        dados["nome_proprietario"] = extrair(
            r"NOME\s+([A-Z\s\.\-]+)\s+CPF",
            texto
        )

        # Local
        dados["local"] = extrair(
            r"\b([A-Z\s]+ PR)\b",
            texto
        )

        return dados

    except Exception as e:
        return {"erro": str(e)}


if __name__ == "__main__":
    pdf_path = sys.argv[1]
    dados = extrair_campos(pdf_path)
    print(json.dumps(dados, ensure_ascii=False, indent=2))
