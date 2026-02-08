import subprocess
import os
import sqlite3
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from langchain_ollama import ChatOllama

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

class ChatInput(BaseModel):
    message: str

def init_db():
    conn = sqlite3.connect('memory.db')
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS profile 
                      (key TEXT PRIMARY KEY, value TEXT)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS history 
                      (id INTEGER PRIMARY KEY AUTOINCREMENT, 
                       role TEXT, content TEXT)''')
    cursor.execute("INSERT OR IGNORE INTO profile (key, value) VALUES ('name', 'Suhash')")
    conn.commit()
    conn.close()

init_db()

llm = ChatOllama(model="llama3.1:8b")

def get_cpp_intelligence(query_key: str):
    try:
        exe_path = os.path.join("data_engine", "search.exe")
        if not os.path.exists(exe_path):
            return "No data found. | User mood is NEUTRAL."

        result = subprocess.run(
            [exe_path, query_key], 
            capture_output=True, 
            text=True, 
            encoding='utf-8',
            timeout=5
        )
        # Returns: "Fact | Sentiment"
        return result.stdout.strip()
    except Exception:
        return "No data found. | User mood is NEUTRAL."

@app.get("/profile")
async def get_profile():
    conn = sqlite3.connect('memory.db')
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM profile WHERE key='name'")
    name = cursor.fetchone()
    conn.close()
    return {"name": name[0] if name else "User"}

@app.post("/chat")
async def chat(input_data: ChatInput):
    user_message = input_data.message
    
    conn = sqlite3.connect('memory.db')
    cursor = conn.cursor()
    cursor.execute("INSERT INTO history (role, content) VALUES (?, ?)", ("user", user_message))
    
    cursor.execute("SELECT value FROM profile WHERE key='name'")
    user_name = cursor.fetchone()[0]

    # C++ Intelligence Call
    cpp_output = get_cpp_intelligence(user_message)
    
    # Split the output safely
    if "|" in cpp_output:
        local_fact, user_mood = cpp_output.split("|", 1)
    else:
        local_fact, user_mood = cpp_output, "User mood is NEUTRAL."

    system_prompt = f"""
    You are Maya, a powerful, professional AI assistant built by Suhash.
    USER NAME: {user_name}
    GROUND TRUTH: {local_fact.strip()}
    OBSERVED VIBE: {user_mood.strip()}
    
    INSTRUCTIONS:
    1. Adapt your tone to the OBSERVED VIBE. If the user is frustrated, be supportive. If happy, be hype.
    2. Mention the user's name ({user_name}) naturally.
    3. Use GROUND TRUTH for technical project details.
    """
    
    try:
        response = await llm.ainvoke([
            ("system", system_prompt),
            ("user", user_message)
        ])
        
        cursor.execute("INSERT INTO history (role, content) VALUES (?, ?)", ("bot", response.content))
        conn.commit()
        conn.close()
        
        return {"reply": str(response.content)}
    except Exception:
        conn.close()
        raise HTTPException(status_code=500, detail="Ollama Error")