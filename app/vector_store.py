from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

model = SentenceTransformer("all-MiniLM-L6-v2")
chunks , vectors = [],[]
index = None

def split_text(text,max_len=20):
    return