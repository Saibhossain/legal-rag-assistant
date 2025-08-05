from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

model = SentenceTransformer("all-MiniLM-L6-v2")
chunks , vectors = [],[]
index = None

def split_text(text,max_len=20):
    return[text[i:i+max_len] for i in range(0,len(text),max_len)]

def build_index(texts):
    global chunks, vectors , index
    chunks = split_text(texts)
    vectors = model.encode(chunks)
    index = faiss.IndexFlatL2(vectors.shape[1])

def search(quary,top_k=3):
    quary_vec = model.encode([quary])
    D, I = index.search(quary_vec,top_k)
    return [chunks[i] for i in I[0]]
