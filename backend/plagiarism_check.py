# plagiarism_check.py

import sys
import json
import os
from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer('all-MiniLM-L6-v2')

def load_text(file_path):
    if file_path.endswith('.pdf'):
        from pdfminer.high_level import extract_text
        return extract_text(file_path)
    elif file_path.endswith('.txt'):
        with open(file_path, 'r') as f:
            return f.read()
    return ""

def compute_similarity(submission_text, other_texts):
    embeddings = model.encode([submission_text] + other_texts, convert_to_tensor=True)
    target = embeddings[0]
    others = embeddings[1:]
    similarities = util.cos_sim(target, others)[0]
    return similarities.tolist()

def main():
    input_data = json.loads(sys.stdin.read())
    submission_text = input_data['submission']
    others = input_data['others']

    scores = compute_similarity(submission_text, others)
    print(json.dumps(scores))

if __name__ == '__main__':
    main()
