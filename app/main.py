from fastapi import FastAPI, UploadFile, File, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import os

from app.file_prarser import parse_pdf, parse_docx
from app.rag_engine import process_document, answer_query

app = FastAPI()

# Mount static files (CSS)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Load templates (HTML)
templates = Jinja2Templates(directory="templates")

UPLOAD_DIR = "data"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    content = ""
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    # Save file to disk
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Parse based on file type
    if file.filename.endswith(".pdf"):
        content = parse_pdf(file_path)
    elif file.filename.endswith(".docx"):
        content = parse_docx(file_path)
    else:
        return {"error": "Unsupported file format"}

    # Process the text for RAG
    process_document(content)
    return {"message": "File uploaded and indexed."}

@app.get("/ask/")
async def ask_query(q: str):
    answer, context = answer_query(q)
    return {"answer": answer, "source": context}