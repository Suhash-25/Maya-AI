import subprocess
import os
import sqlite3
import logging
import uvicorn
from fastapi import UploadFile, File, FastAPI, HTTPException
import shutil
from datetime import datetime
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from langchain_ollama import ChatOllama
from langchain_tavily import TavilySearch
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings
from langchain_core.messages import SystemMessage, HumanMessage, ToolMessage
from typing import Optional
import platform

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
os.environ["TAVILY_API_KEY"] = os.getenv("TAVILY_API_KEY", "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")

search_tool = TavilySearch(
    max_results=3, 
    search_depth="advanced",
    include_answer=True 
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class ChatInput(BaseModel):
    message: str
    image: Optional[str] = None

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

embeddings = OllamaEmbeddings(model="nomic-embed-text")
vector_db = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)

def add_to_long_term_memory(text: str):
    """Indexes a new interaction into the vector database"""
    vector_db.add_texts([text])

try:
    llm = ChatOllama(model="llama3.1:8b", temperature=0).bind_tools([search_tool])
    vision_llm = ChatOllama(model="llama3.2-vision", temperature=0.0)
except Exception as e:
    logging.error(f"Failed to initialize models: {e}")

def get_cpp_intelligence(query_key: str):
    try:
        # Check OS: Use .exe for Windows, no extension for Linux
        ext = ".exe" if platform.system() == "Windows" else ""
        exe_path = os.path.join("engine", f"search_engine{ext}") 
        
        result = subprocess.run([exe_path, query_key], capture_output=True, text=True, encoding='utf-8', timeout=5)
        return result.stdout.strip()
    except Exception as e:
        return f"No data found. | User mood is NEUTRAL. Error: {e}"

@app.get("/")
async def health_check():
    return {"status": "Maya Backend is Live on 8080"}

@app.post("/chat")
async def chat(input_data: ChatInput):
    global llm, vision_llm
    user_message = input_data.message
    image_b64 = input_data.image
    steps = []
    
    steps.append({"id": 1, "status": "Querying long-term memory...", "icon": "🗄️"})
    try:
        past_context = vector_db.similarity_search(user_message, k=3)
        long_term_memory = "\n".join([doc.page_content for doc in past_context])
    except Exception:
        long_term_memory = "No prior related memories found."
        
    cpp_output = get_cpp_intelligence(user_message)
    parts = cpp_output.split(" | ")
    local_fact = parts[0]
    user_mood = parts[1] if len(parts) > 1 else "NEUTRAL"
    
    conn = sqlite3.connect('memory.db')
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM profile WHERE key='name'")
    user_name = cursor.fetchone()[0]

    system_prompt = f"""<system_instructions>
You are MAYA, a highly advanced, omni-capable AI assistant. Your architecture is designed to provide flawless, expert-level answers to ANY question the user asks.

[SYSTEM CONTEXT]
User Name: {user_name}
System Time: {datetime.now().strftime("%A, %b %d, %Y %I:%M %p")}
Local Data: {local_fact}
Past Memories: {long_term_memory}

[CORE DIRECTIVES - VIOLATION IS FORBIDDEN]
1. EXPERTISE & TONE: You are a world-class expert in all fields (programming, science, history, etc.). Provide direct, highly accurate, and comprehensive answers. Never use conversational filler like "As an AI...".
2. THE TWO-PATH ROUTING PROTOCOL:
   - PATH A (General Knowledge): For programming, math, history, logic, or established facts, rely on your deep internal knowledge. Provide the answer immediately with elite formatting (Markdown, code blocks, bullet points).
   - PATH B (Live Data): If the user asks about the weather, current events, sports scores, or anything happening TODAY, you MUST use your search tool.
3. TOOL EXECUTION (When Path B is triggered):
   - Extract the exact answer from the tool results. 
   - Translate raw API formats (like wind degrees or Unix timestamps) into natural, human-readable language.
   - For weather: Always provide the exact CURRENT temperature in Celsius (°C) unless asked otherwise.
   - If the tool fails or returns no data, reply: "I do not have verified live data for this query."
4. ZERO HALLUCINATION: If you do not know the answer and cannot search for it, explicitly state: "I do not have enough verified information to answer this." Never guess.
5. MEMORY RECALL: Use 'Past Memories' to answer personal questions. NEVER say "Based on the memory..." or "Based on the tool...". Just state the fact.

[OUTPUT STRUCTURE]
- Direct Answer: Start with the most direct answer to the user's prompt.
- Elaboration: Provide the "why" and "how" with structured details if the topic is complex.

[EXAMPLES]
User: What is the weather in London?
Elite Output: **Current Weather in London**
* **Temperature:** 15°C
* **Conditions:** Partly cloudy skies

User: Who won the match?
Elite Output: **Live Match Result**
India won the match against Australia by **6 wickets**.

User: What are the benefits of React?
Elite Output: **Key Benefits of React:**
1. **Component-Based:** Allows for reusable UI elements.
2. **Virtual DOM:** Ensures fast rendering and better performance.
3. **Ecosystem:** Huge community and library support.

User: Write a React component.
Elite Output: **Complex React Component**
Here is a component using composition and context:
```jsx
// code here
</system_instructions>"""

    if image_b64:
        steps.append({"id": 2, "status": "Performing Deep OCR Analysis...", "icon": "👁️"})
        active_llm = vision_llm
        
        vision_prompt = """
You are an Advanced Multimodal Intelligence specialized in high-precision visual analysis.
Your goal is to perform a granular extraction of all data within the provided image.

PHASE 1: CLASSIFICATION
Identify the exact nature of this image (e.g., Official Government Document, Handwritten Note, Schematic, Screenshot, Landscape, etc.). 
If it is a document, identify the primary language (e.g., Kannada, English, Hindi) and the issuing authority.

PHASE 2: DETAILED EXTRACTION
- TEXT (OCR): Extract every word with 100% fidelity. Maintain the original layout and hierarchy (headers, subheaders, body text).
- ENTITIES: Identify and list specific names, dates, identification numbers, monetary values, and locations.
- VISUALS: Describe any emblems, seals, stamps, barcodes, or signatures. Note if a signature appears digital or physical.
- NON-ENGLISH TEXT: Provide a direct word-for-word translation for any non-English scripts detected.

PHASE 3: VERIFICATION
Review the extracted data against the raw image to ensure no 'hallucinations' or misreadings occurred.

FINAL OUTPUT:
Provide a precise, factual breakdown. Do not be conversational. 
If the image is low quality, state exactly which parts are illegible rather than guessing.
"""
        content = [
            {"type": "text", "text": f"{vision_prompt}\nUser Question: {user_message}"},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}}
        ]
        messages = [SystemMessage(content=system_prompt), HumanMessage(content=content)]
    else:
        steps.append({"id": 2, "status": "Checking local memory...", "icon": "🧠"})
        active_llm = llm
        messages = [SystemMessage(content=system_prompt), HumanMessage(content=user_message)]

    try:
        steps.append({"id": 3, "status": "Analyzing request...", "icon": "🔍"})
        ai_msg = await active_llm.ainvoke(messages)
        messages.append(ai_msg)

        if hasattr(ai_msg, 'tool_calls') and ai_msg.tool_calls:
            steps.append({"id": 4, "status": "Searching the live web...", "icon": "🌐"})
            for tool_call in ai_msg.tool_calls:
                try:
                    search_result = search_tool.run(tool_call["args"]["query"])
                    if not search_result:
                        search_result = "SEARCH FAILED: No data returned."
                    messages.append(ToolMessage(content=search_result, tool_call_id=tool_call["id"]))
                except Exception as e:
                    messages.append(ToolMessage(content=f"Search Error: {str(e)}", tool_call_id=tool_call["id"]))
            
            steps.append({"id": 5, "status": "Synthesizing answer...", "icon": "✨"})
            ai_msg = await active_llm.ainvoke(messages)

        cursor.execute("INSERT INTO history (role, content) VALUES (?, ?)", ("user", user_message))
        cursor.execute("INSERT INTO history (role, content) VALUES (?, ?)", ("bot", ai_msg.content))
        conn.commit()
        conn.close()
        
        # Save to Chroma Vector DB inside the endpoint logic!
        add_to_long_term_memory(f"User Asked: {user_message}\nMaya Answered: {ai_msg.content}")
        
        return {"reply": str(ai_msg.content), "steps": steps}

    except Exception as e:
        if 'conn' in locals(): conn.close()
        logging.error(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename, "status": "File indexed for analysis"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8080)