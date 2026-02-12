import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './App.css';

function App() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);

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

  const speak = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => v.name.includes("Female") || v.name.includes("Zira"));
    if (femaleVoice) utterance.voice = femaleVoice;
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    setHistory(prev => [...prev, { role: 'user', content: input }]);
    setLoading(true);
    setInput("");

    try {
      const { data } = await axios.post('http://localhost:8080/chat', {
        prompt: input,
        session_id: "suhash_master"
      });
      setHistory(prev => [...prev, { role: 'maya', content: data.response, source: data.source }]);
      speak(data.response);
    } catch { console.error("Maya Offline."); } 
    finally { setLoading(false); }
  };

  return (
    <div className="app-container">
      <div className="aurora-bg">
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 15, repeat: Infinity }} className="blob blob-blue" />
        <motion.div animate={{ scale: [1.2, 1, 1.2] }} transition={{ duration: 18, repeat: Infinity }} className="blob blob-purple" />
      </div>

      <main className="main-chat">
        <header className="header">MAYA • LIVE AGENT</header>
        <div className="chat-window" ref={scrollRef}>
          {history.length === 0 ? (
            <div className="welcome-screen">
              <h1>Welcome, Suhash.</h1>
              <p>Real-time data feed is active. Testing Today's Facts...</p>
            </div>
          ) : (
            history.map((msg, i) => (
              <div key={i} className={`message ${msg.role === 'user' ? 'user-msg' : 'maya-msg'}`}>
                <div className={`bubble ${msg.role === 'user' ? 'user-bubble' : 'maya-bubble'}`}>
                  {msg.content}
                  {msg.source && <div className="source-tag">📡 {msg.source}</div>}
                </div>
              </div>
            ))
          )}
          {loading && <div className="shimmer-line" style={{width: '240px', margin: '20px'}}></div>}
        </div>

        <div className="input-area">
          <div className="input-pill">
            <button className={`icon-btn ${isListening ? 'active-mic' : ''}`} onClick={() => { setIsListening(true); recognitionRef.current.start(); }}>🎤</button>
            <input placeholder="Ask Maya anything..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} />
            <button className="send-btn" onClick={sendMessage}>Send</button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;