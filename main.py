import subprocess
import os
import sqlite3
import logging
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from langchain_ollama import ChatOllama
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_core.messages import SystemMessage, HumanMessage, ToolMessage

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
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

search_tool = DuckDuckGoSearchRun()

class _DummyResponse:
    def __init__(self):
        self.content = 'Ollama unavailable'
        self.tool_calls = []

class _DummyLLM:
    async def ainvoke(self, messages):
        return _DummyResponse()

try:
    llm = ChatOllama(model="llama3.1:8b", temperature=0).bind_tools([search_tool])
except Exception as e:
    logging.error(f"Model error: {e}")
    llm = _DummyLLM()
def get_cpp_intelligence(query_key: str):
    try:
        exe_path = os.path.join("data_engine", "search.exe")
        result = subprocess.run([exe_path, query_key], capture_output=True, text=True, encoding='utf-8', timeout=5)
        return result.stdout.strip()
    except Exception:
        return "No data found. | User mood is NEUTRAL."
@app.post("/chat")
async def chat(input_data: ChatInput):
    user_message = input_data.message
    cpp_output = get_cpp_intelligence(user_message)
    parts = cpp_output.split(" | ")
    local_fact = parts[0] if len(parts) > 0 else "No data found."
    user_mood = parts[1] if len(parts) > 1 else "NEUTRAL"
    
    conn = sqlite3.connect('memory.db')
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM profile WHERE key='name'")
    user_name = cursor.fetchone()[0]

    system_prompt = f"""
    ROLE: You are Maya, a sophisticated, concise, and helpful live agentic AI.. User: {user_name}.
    DATE: {datetime.now().strftime("%A, %B %d, %Y")}.
    MOOD: {user_mood}
    LOCAL_DATA: {local_fact}

    MANDATORY RULES:
    1. If the user asks for real-time data (gold, weather, news), USE THE SEARCH TOOL.
    2. Prioritize search results over your own internal training data.
    3. Be concise and professional.
    4. You have access to a web search tool. Use it whenever a user asks for factual, 
   real-time, or technical data that is not in your training.
    5. If you use a tool, summarize the findings clearly and accurately.
    6. Be direct. Avoid small talk unless user initiates it.
    7. Your goal is maximum utility. If you find multiple facts, list them as bullets.
    """

    messages = [SystemMessage(content=system_prompt), HumanMessage(content=user_message)]

    try:
        ai_msg = await llm.ainvoke(messages)
        messages.append(ai_msg)

        if ai_msg.tool_calls:
            for tool_call in ai_msg.tool_calls:
                search_query = tool_call["args"]["query"]
                print(f"Maya is searching for: {search_query}")
                
                search_result = search_tool.run(search_query)
                messages.append(ToolMessage(content=search_result, tool_call_id=tool_call["id"]))
            
            final_msg = await llm.ainvoke(messages)
            ai_msg = final_msg
            
        cursor.execute("INSERT INTO history (role, content) VALUES (?, ?)", ("user", user_message))
        cursor.execute("INSERT INTO history (role, content) VALUES (?, ?)", ("bot", ai_msg.content))
        conn.commit()
        conn.close()
        
        return {"reply": str(ai_msg.content)}

    except Exception as e:
        if 'conn' in locals(): conn.close()
        raise HTTPException(status_code=500, detail=f"Maya Brain Error: {str(e)}")

# ... (Keep /history, /profile, and /clear routes exactly as they were) ...

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8080)