from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()
api_key = os.getenv("GROQ_api_key")
client = Groq(api_key=api_key)

def generate_answer(context,question):
    prompt = f"Context:\n{context}\n\nQuestion: {question}\nAnswer:"
    response = client.chat.completions.create(
    model="mixtral-8x7b-32768",
    messages=[{"role": "user","content": prompt}]
    )
    return response.choices[0].message['content']