#!/usr/bin/env python
"""
Script to list available Gemini models
"""
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv("backend/.env")
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("❌ GEMINI_API_KEY not found in .env")
    exit(1)

# Configure the API
genai.configure(api_key=api_key)

print("=" * 60)
print("  Available Gemini Models")
print("=" * 60 + "\n")

try:
    # List all available models
    models = genai.list_models()
    
    embedding_models = []
    chat_models = []
    other_models = []
    
    for model in models:
        model_name = model.name
        if 'embed' in model_name.lower():
            embedding_models.append(model_name)
        elif 'chat' in model_name.lower() or 'gemini' in model_name.lower():
            chat_models.append(model_name)
        else:
            other_models.append(model_name)
    
    if embedding_models:
        print("📊 Embedding Models:")
        for model in embedding_models:
            print(f"  - {model}")
    else:
        print("❌ No embedding models found")
    
    print()
    
    if chat_models:
        print("💬 Chat/LLM Models:")
        for model in chat_models[:5]:  # Show first 5
            print(f"  - {model}")
        if len(chat_models) > 5:
            print(f"  ... and {len(chat_models) - 5} more")
    
    print()
    
    if other_models:
        print("🔧 Other Models:")
        for model in other_models[:5]:  # Show first 5
            print(f"  - {model}")
        if len(other_models) > 5:
            print(f"  ... and {len(other_models) - 5} more")
    
    print("\n" + "=" * 60)
    print(f"Total models available: {len(models)}")
    print("=" * 60)
    
except Exception as e:
    print(f"❌ Error listing models: {str(e)}")
    import traceback
    traceback.print_exc()
