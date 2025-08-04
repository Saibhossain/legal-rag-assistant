import pdfplumber
from docx import Document

def perse_pdf(file_path):
    with pdfplumber.open(file_path) as pdf :
        return "\n".join(page.extract_text() or ""for page in pdf.page)

def pers_docx(file_path):
    doc = Document(file_path)
    return"\n".join(p.text for p in doc.paragraphs)