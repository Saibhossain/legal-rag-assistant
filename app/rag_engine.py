from app.vector_store import build_index,search
from app.llm_client import generate_answer

def process_document(text):
    build_index(text)

def answer_query(query):
    context = "\n".join(search(query))
    return generate_answer(context, query), context