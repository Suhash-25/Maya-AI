import subprocess
import os
import sqlite3
import logging
import uvicorn
from fastapi import UploadFile, File
import shutil
from datetime import datetime
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from langchain_ollama import ChatOllama
from langchain_tavily import TavilySearch
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings
from langchain_core.messages import SystemMessage, HumanMessage, ToolMessage
import base64
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.environ["TAVILY_API_KEY"] = "taivly-api-key-here"

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


# Define models globally to be reused
try:
    llm = ChatOllama(model="llama3.1:8b", temperature=0).bind_tools([search_tool])
    vision_llm = ChatOllama(model="llama3.2-vision", temperature=0.0)
except Exception as e:
    logging.error(f"Failed to initialize models: {e}")

embeddings = OllamaEmbeddings(model="nomic-embed-text")
vector_db = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)

def add_to_long_term_memory(text: str):
    """Indexes a new interaction into the vector database"""
    vector_db.add_texts([text])

def get_cpp_intelligence(query_key: str):
    try:
        exe_path = os.path.join("data_engine", "search.exe")
        result = subprocess.run([exe_path, query_key], capture_output=True, text=True, encoding='utf-8', timeout=5)
        return result.stdout.strip()
    except Exception:
        return "No data found. | User mood is NEUTRAL."
    
@app.get("/")
async def health_check():
    return {"status": "Maya Backend is Live on 8080"}

@app.post("/chat")
async def chat(input_data: ChatInput):
    global llm, vision_llm
    user_message = input_data.message
    image_b64 = input_data.image
    steps = []
    
    # 1. Gather Context
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
You are MAYA, an elite, high-precision live-data AI agent. Your primary directive is ABSOLUTE FACTUAL ACCURACY.

[CONTEXT]
User: {user_name}
Current System Time: {datetime.now().strftime("%A, %b %d, %Y %I:%M %p")}
Local Data: {local_fact}

[CORE RULES - VIOLATION IS STRICTLY FORBIDDEN]
1. ZERO HALLUCINATION: You are strictly prohibited from guessing, estimating, or inventing facts, dates, weather, or sports schedules. 
2. LIVE TOOL DEPENDENCE: When a search tool provides results, your answer MUST be extracted 100% from those results. 
3. MISSING DATA PROTOCOL: If the search tool returns irrelevant data, or if you do not have the exact answer in your tool context, you MUST reply EXACTLY with: "I do not have verified live data for this query." Do not attempt to guess.
4. RUTHLESS CONCISION: Deliver the exact answer immediately. DO NOT use conversational filler. Just state the facts.

[EXECUTION]
Analyze the provided context and tool results. Extract the exact requested values. Output only the final synthesized fact.
</system_instructions>"""

    # 2. Build Messages based on input type
    if image_b64:
        steps.append({"id": 1, "status": "Performing Deep OCR Analysis...", "icon": "👁️"})
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
- NON-ENGLISH TEXT: Provide a direct word-for-word translation for any non-English scripts detected (especially Kannada).

PHASE 3: VERIFICATION
Review the extracted data against the raw image to ensure no 'hallucinations' or misreadings occurred.

FINAL OUTPUT:
Provide a precise, factual breakdown. Do not be conversational. 
If the image is low quality, state exactly which parts are illegible rather than guessing.
"""
    
        steps.append({"id": 2, "status": "Processing visual input...", "icon": "🖼️"})
        content = [
            {"type": "text", "text": f"{vision_prompt}\nUser Question: {user_message}"},
            {"type": "image_url", "image_url": f"data:image/jpeg;base64,{image_b64}"}
        ]
        messages = [SystemMessage(content=system_prompt), HumanMessage(content=content)]
    else:
        steps.append({"id": 1, "status": "Checking local memory...", "icon": "🧠"})
        active_llm = llm
        messages = [SystemMessage(content=system_prompt), HumanMessage(content=user_message)]

    try:
        # 3. First Inference
        steps.append({"id": 2, "status": "Analyzing request...", "icon": "🔍"})
        ai_msg = await active_llm.ainvoke(messages)
        messages.append(ai_msg)

        # 4. Handle Tool Calls (Only for non-vision or if vision model supports tools)
        if hasattr(ai_msg, 'tool_calls') and ai_msg.tool_calls:
            steps.append({"id": 3, "status": "Searching the live web...", "icon": "🌐"})
            for tool_call in ai_msg.tool_calls:
                try:
                    search_result = search_tool.run(tool_call["args"]["query"])
                    if not search_result:
                        search_result = "SEARCH FAILED: No data returned."
                    messages.append(ToolMessage(content=search_result, tool_call_id=tool_call["id"]))
                except Exception as e:
                    messages.append(ToolMessage(content=f"Search Error: {str(e)}", tool_call_id=tool_call["id"]))
            
            steps.append({"id": 4, "status": "Synthesizing answer...", "icon": "✨"})
            ai_msg = await active_llm.ainvoke(messages)

        # 5. Persistent History
        cursor.execute("INSERT INTO history (role, content) VALUES (?, ?)", ("user", user_message))
        cursor.execute("INSERT INTO history (role, content) VALUES (?, ?)", ("bot", ai_msg.content))
        conn.commit()
        conn.close()
        
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