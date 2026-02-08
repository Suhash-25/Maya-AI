import subprocess
import os
import sqlite3
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from langchain_ollama import ChatOllama
from langchain_community.tools import DuckDuckGoSearchRun

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
    cursor.execute('CREATE TABLE IF NOT EXISTS profile (key TEXT PRIMARY KEY, value TEXT)')
    cursor.execute('CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY AUTOINCREMENT, role TEXT, content TEXT)')
    cursor.execute("INSERT OR IGNORE INTO profile (key, value) VALUES ('name', 'Suhash')")
    cursor.execute("INSERT OR IGNORE INTO profile (key, value) VALUES ('role', 'Lead Developer @ Maya Agentic')")
    cursor.execute("INSERT OR IGNORE INTO profile (key, value) VALUES ('tech', 'C++, React, FastAPI, Ollama')")
    conn.commit()
    conn.close()

init_db()

llm = ChatOllama(model="llama3.1:8b")
search_tool = DuckDuckGoSearchRun()

def get_cpp_intelligence(query_key: str):
    try:
        exe_path = os.path.join("data_engine", "search.exe")
        result = subprocess.run([exe_path, query_key], capture_output=True, text=True, encoding='utf-8', timeout=5)
        return result.stdout.strip()
    except Exception:
        return "No data found. | User mood is NEUTRAL."

@app.get("/profile")
async def get_profile():
    conn = sqlite3.connect('memory.db')
    cursor = conn.cursor()
    cursor.execute("SELECT key, value FROM profile")
    data = dict(cursor.fetchall())
    conn.close()
    return data

@app.post("/chat")
async def chat(input_data: ChatInput):
    user_message = input_data.message
    
    # Get C++ intelligence
    cpp_output = get_cpp_intelligence(user_message)
    parts = cpp_output.split(" | ")
    local_fact = parts[0] if len(parts) > 0 else "No data found."
    user_mood = parts[1] if len(parts) > 1 else "NEUTRAL"
    
    # Get user profile
    conn = sqlite3.connect('memory.db')
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM profile WHERE key='name'")
    result = cursor.fetchone()
    user_name = result[0] if result else "User"

    # UPDATED SYSTEM PROMPT: Strict, Minimalist, Professional
    system_prompt = f"""
    You are Maya, a Gen-Z savvy AI assistant. User: {user_name}.
    MOOD: {user_mood.strip()}
    LOCAL DATA: {local_fact.strip()}
    
    STRICT RULES:
    1. Do NOT ramble. If the user says "Hi", just say "Hi" back with a brief project update.
    2. Do NOT mention songs, memes, or pop culture unless the user asks.
    3. Be incredibly concise. Your goal is utility, not small talk.
    4. Always prioritize LOCAL DATA for technical answers.
    5. Avoid rambling. Limit all non-technical responses to 15 words.
    6. Use LOCAL_FACT as the absolute truth for the project.
    7. Speak in a sophisticated, concise, and helpful tone.
    """
    
    try:
        response = await llm.ainvoke([("system", system_prompt), ("user", user_message)])
        cursor.execute("INSERT INTO history (role, content) VALUES (?, ?)", ("user", user_message))
        cursor.execute("INSERT INTO history (role, content) VALUES (?, ?)", ("bot", response.content))
        conn.commit()
        conn.close()
        return {"reply": str(response.content)}
    except Exception:
        conn.close()
        raise HTTPException(status_code=500, detail="Core Inference Failure")
    
@app.get("/history")
async def get_history():
    conn = sqlite3.connect('memory.db')
    cursor = conn.cursor()
    # Fetch unique user messages to act as "Chat Titles"
    cursor.execute("SELECT content FROM history WHERE role='user' ORDER BY id DESC LIMIT 10")
    chats = cursor.fetchall()
    conn.close()
    return {"history": [chat[0][:25] + "..." for chat in chats]}

@app.post("/clear")
async def clear_history():
    conn = sqlite3.connect('memory.db')
    cursor = conn.cursor()
    cursor.execute("DELETE FROM history")
    conn.commit()
    conn.close()
    return {"status": "cleared"}