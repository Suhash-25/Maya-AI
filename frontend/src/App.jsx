import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './App.css';

function App() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeSteps, setActiveSteps] = useState([]);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const [attachedFile, setAttachedFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.onresult = (e) => {
        setInput(e.results[0][0].transcript);
        setIsListening(false);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, loading, activeSteps]);

  const speak = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => v.name.includes("Female") || v.name.includes("Zira"));
    if (femaleVoice) utterance.voice = femaleVoice;
    window.speechSynthesis.speak(utterance);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setAttachedFile(file);
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    let base64Image = null;
    let imagePreview = null;
    if (attachedFile && attachedFile.type.startsWith('image/')) {
      imagePreview = URL.createObjectURL(attachedFile);
      base64Image = await convertToBase64(attachedFile);
    }

    setHistory(prev => [...prev, { role: 'user', content: input, image: imagePreview }]);
    setLoading(true);
    setActiveSteps([]);
    const currentInput = input;
    setInput("");
    setAttachedFile(null);

    try {
      const { data } = await axios.post('http://localhost:8080/chat', {
        message: currentInput,
        image: base64Image
      });

      // Catch steps from backend
      if (data.steps) {
        setActiveSteps(data.steps);
      }

      // Small delay to let user see the final processing step
      setTimeout(() => {
        setHistory(prev => [...prev, {
          role: 'maya',
          content: data.reply || data.response,
          source: data.source
        }]);
        speak(data.reply || data.response);
        setLoading(false);
        setActiveSteps([]);
      }, 1000);

    } catch {
      console.error("Maya Offline.");
      setLoading(false);
    }
  };

  const handleMicClick = () => {
    setIsListening(true);
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  return (
    <div className="app-container">
      <div className="aurora-bg">
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 15, repeat: Infinity }} className="blob blob-blue" />
        <motion.div animate={{ scale: [1.2, 1, 1.2] }} transition={{ duration: 18, repeat: Infinity }} className="blob blob-purple" />
      </div>

      <main className="main-chat">
        <header className="header">MAYA AI • LIVE AGENT</header>

        <div className="chat-window" ref={scrollRef}>
          {history.length === 0 ? (
            <div className="welcome-screen">
              <h1>Welcome, Suhash.</h1>
              <p>Real-time data feed is active. Ask me anything about today.</p>
            </div>
          ) : (
            history.map((msg, i) => (
              <div key={i} className={`message ${msg.role === 'user' ? 'user-msg' : 'maya-msg'}`}>
                <div className={`bubble ${msg.role === 'user' ? 'user-bubble' : 'maya-bubble'}`}>
                  {msg.image && (
                    <div className="chat-image-container">
                      <img src={msg.image} alt="User upload" className="chat-inline-image" />
                    </div>
                  )}
                  <div className="text-content">{msg.content}</div>
                  {msg.source && <div className="source-tag">📡 {msg.source}</div>}
                </div>
              </div>
            ))
          )}

          {/* GEMINI-STYLE PROCESSING STEPS */}
          {loading && (
            <div className="maya-msg">
              <div className="bubble maya-bubble thinking-state">
                <div className="steps-container">
                  <AnimatePresence>
                    {activeSteps.map((step, idx) => (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.2 }}
                        className="step-row"
                      >
                        <span className="step-icon">{step.icon}</span>
                        <span className="step-text">{step.status}</span>
                      </motion.div>
                    ))}

                  </AnimatePresence>
                </div>
                <div className="typing-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="input-area">
          <div className="input-pill">
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} accept="image/*" />
            <button className="icon-btn" onClick={() => fileInputRef.current?.click()}>📎</button>
            <button className={`icon-btn ${isListening ? 'active-mic' : ''}`} onClick={handleMicClick}>🎤</button>
            {attachedFile && (
              <div className="file-tag">
                Image Attached
                <button onClick={() => setAttachedFile(null)}>×</button>
              </div>
            )}
            <input
              placeholder={attachedFile ? "Ask about this file..." : "Ask Maya anything...."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button className="send-btn" onClick={sendMessage} disabled={loading}>Send</button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;