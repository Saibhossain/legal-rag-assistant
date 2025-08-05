from app.vector_store import build_index,search
from app.llm_client import generate_answer

def process_document(text):
    build_index(text)

def asnwer_quary(quary):
    context = "\n".join(search(quary))
    return generate_answer(context,quary),context
