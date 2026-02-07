import subprocess
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from langchain_ollama import ChatOllama

# 1. Initialize FastAPI app
app = FastAPI()

# 2. Configure CORS for your React Frontend (localhost:5173)
# This fixes the '405 Method Not Allowed' and Preflight errors
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# 3. Request model
class ChatInput(BaseModel):
    message: str

# 4. Initialize Local LLM (Ollama)
# Ensure you have run 'ollama run llama3.1:8b' in your terminal first
llm = ChatOllama(model="llama3.1:8b")

# 5. C++ Knowledge Retrieval Function
def get_cpp_context(query_key: str):
    try:
        # Path to your compiled C++ search engine
        exe_path = os.path.join("data_engine", "search.exe")
        
        # Security: check if exe exists
        if not os.path.exists(exe_path):
            return "Local search engine not found."

        # Run search.exe and capture the output
        # Using encoding='utf-8' for multilingual support
        result = subprocess.run(
            [exe_path, query_key], 
            capture_output=True, 
            text=True, 
            encoding='utf-8',
            timeout=5
        )
        return result.stdout.strip()
    except subprocess.TimeoutExpired:
        return "Search timed out."
    except Exception as e:
        print(f"Internal Search Error: {e}")
        return "No local context."

# 6. Chat Endpoint
@app.post("/chat")
async def chat(input_data: ChatInput):
    user_message = input_data.message

    # Step A: Perform high-speed lookup using the C++ module
    local_fact = get_cpp_context(user_message)
    
    # Step B: Construct the Agentic System Prompt
    # This instructs the LLM to prioritize your 'knowledge.txt' facts
    system_prompt = f"""
    You are Maya, a powerful, professional AI assistant built by Suhash. 
    KNOWLEDGE BASE TRUTH: {local_fact}
    
    INSTRUCTIONS:
    1. If KNOWLEDGE BASE TRUTH is relevant, use it as the primary source of truth.
    2. If it is 'No specific local data found', use your general knowledge.
    3. Stay in character: helpful, tech-savvy, and concise.
    """
    
    try:
        # Step C: Generate response with Ollama
        response = await llm.ainvoke([
            ("system", system_prompt),
            ("user", user_message)
        ])
        
        # Step D: Return CLEAN text to the React Frontend
        return {"reply": str(response.content)}
        
    except Exception as e:
        print(f"Ollama Error: {e}")
        raise HTTPException(status_code=500, detail="Local LLM is offline. Check Ollama status.")

# Optional: Root endpoint to verify server is alive
@app.get("/")
async def root():
    return {"status": "Maya Backend is Online"}