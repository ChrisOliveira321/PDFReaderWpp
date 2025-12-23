import sys
from io import BytesIO
from PyPDF2 import PdfReader

# Lê o PDF enviado pelo Node
pdf_data = sys.stdin.buffer.read()
pdf_file = BytesIO(pdf_data)

reader = PdfReader(pdf_file)
texto = ""
for page in reader.pages:
    texto += page.extract_text() + "\n"

# Imprime o texto para o Node pegar
print(texto)
