# Use official Python 3.12 image
FROM python:3.12-slim

# Install system dependencies (g++ is needed to compile your C++ code)
RUN apt-get update && apt-get install -y g++ sqlite3 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install langchain-chroma chromadb langchain-tavily

# Copy the rest of the backend code
COPY . .

# Compile the C++ engine for Linux!
RUN g++ engine/search.cpp -o engine/search_engine

# Expose the FastAPI port
EXPOSE 8080

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]