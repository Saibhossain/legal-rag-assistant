from fastapi import FastAPI, UploadFile, File
from app.file_prarser import pers_docx,perse_pdf
from rag_engine import asnwer_quary, process_document

app = FastAPI()

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    content = ""
    if file.filename.endswith(".pdf"):
        with open("temp.pdf", "wb") as f: f.write(await file.read())
        content = perse_pdf("temp.pdf")
    elif file.filename.endswith(".docx"):
        with open("temp.docx", "wb") as f: f.write(await file.read())
        content = pers_docx("temp.docx")
    else:
        return {"error": "Unsupported file format"}

    process_document(content)
    return {"message": "File uploaded and indexed."}

@app.get("/ask/")
def ask_query(q: str):
    answer, context = asnwer_quary(q)
    return {"answer": answer, "source": context}