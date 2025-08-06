import pdfplumber
from docx import Document

def parse_pdf(file_path):
    """Extract text from a PDF using pdfplumber."""
    try:
        text = ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                content = page.extract_text()
                if content:
                    text += content + "\n"
        return text.strip()
    except Exception as e:
        print(f"❌ Error parsing PDF: {e}")
        return ""

def parse_docx(file_path):
    """Extract text from a DOCX file using python-docx."""
    try:
        doc = Document(file_path)
        return "\n".join(para.text for para in doc.paragraphs if para.text).strip()
    except Exception as e:
        print(f"❌ Error parsing DOCX: {e}")
        return ""
