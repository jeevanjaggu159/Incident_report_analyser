import google.generativeai as genai
import os

key = "AIzaSyDEy3jGmGASdjNd5z1ynweYbPjiAtloLL8"
genai.configure(api_key=key)

try:
    print("Testing models/text-embedding-004")
    result = genai.embed_content(
        model="models/text-embedding-004",
        content="Hello world",
        task_type="retrieval_document"
    )
    print("models/text-embedding-004 SUCCESS!")
except Exception as e:
    print(f"models/text-embedding-004 ERROR: {e}")

try:
    print("Testing models/embedding-001")
    result = genai.embed_content(
        model="models/embedding-001",
        content="Hello world",
        task_type="retrieval_document"
    )
    print("models/embedding-001 SUCCESS!")
except Exception as e:
    print(f"models/embedding-001 ERROR: {e}")
