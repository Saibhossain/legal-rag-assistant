from fastapi import FastAPI, UploadFile, File
from app.file_prarser import pers_docx,perse_pdf
from rag_engine import asnwer_quary, process_document

app = FastAPI()

@app.post("/upload")
async def()