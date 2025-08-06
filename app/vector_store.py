import os
import faiss
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer

# Load embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")

# File paths
index_file = "storage/faiss_index.index"
meta_file = "storage/text_chunks.pkl"

# In-memory variables
chunks = []
vectors = []
index = None

def split_text(text, max_len=500):
    """Split text into chunks of max_len characters (naive chunking)."""
    return [text[i:i + max_len] for i in range(0, len(text), max_len)]

def build_index(texts):
    """Split text, encode using SentenceTransformer, and store index + metadata."""
    global chunks, vectors, index

    # Split and embed
    chunks = split_text(texts)
    vectors = model.encode(chunks)

    # Create and populate FAISS index
    index = faiss.IndexFlatL2(vectors.shape[1])
    index.add(np.array(vectors))

    # Save index and metadata
    os.makedirs("storage", exist_ok=True)
    faiss.write_index(index, index_file)
    with open(meta_file, 'wb') as f:
        pickle.dump(chunks, f)

def load_index():
    """Load FAISS index and text chunks from disk."""
    global index, chunks
    if os.path.exists(index_file) and os.path.exists(meta_file):
        index = faiss.read_index(index_file)
        with open(meta_file, 'rb') as f:
            chunks = pickle.load(f)
    else:
        index = None
        chunks = []

def search(query, top_k=3):
    """Search top_k similar text chunks for the given query."""
    global index, chunks

    if index is None:
        load_index()
    if index is None:
        raise ValueError("Index is not initialized. Upload and process a document first.")

    query_vec = model.encode([query])
    D, I = index.search(np.array(query_vec), top_k)

    return [chunks[i] for i in I[0]]
