import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const BotAvatar = ({ status }) => (
  <div className={`gemini-avatar ${status}`}>
    <div className="avatar-sparkle" />
  </div>
);

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [profile, setProfile] = useState({ name: 'User', role: 'Dev', tech: '' });
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef(null);

  // --- VOICE SYSTEMS ---
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = useRef(SpeechRecognition ? new SpeechRecognition() : null);

  useEffect(() => {
    if (recognition.current) {
      recognition.current.onresult = (e) => handleManualSend(e.results[0][0].transcript);
      recognition.current.onend = () => setIsListening(false);
    }
    const init = async () => {
      const res = await axios.get('http://127.0.0.1:8000/profile');
      setProfile(res.data);
      setMessages([{ text: `Hello ${res.data.name}, I'm Maya. How can I help you today?`, sender: 'bot', id: 'welcome' }]);
    };
    init();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const speakResponse = (text) => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    const female = voices.find(v => v.name.includes('Natural') || v.name.includes('Google UK English Female') || v.name.includes('Zira'));
    if (female) utterance.voice = female;
    utterance.rate = 0.95;
    synth.speak(utterance);
  };

  const handleManualSend = async (val) => {
    const text = val || input;
    if (!text.trim() || isTyping) return;
    setMessages(p => [...p, { text, sender: 'user', id: Date.now() }]);
    setInput('');
    setIsTyping(true);
    try {
      const res = await axios.post('http://127.0.0.1:8000/chat', { message: text });
      setTimeout(() => {
        setMessages(p => [...p, { text: res.data.reply, sender: 'bot', id: Date.now() + 1 }]);
        setIsTyping(false);
        speakResponse(res.data.reply);
      }, 800);
    } catch (err) { setIsTyping(false); }
  };

  return (
    <div className="gemini-container">
      {/* BACKGROUND ANIMATION: MESH GRADIENT */}
      <div className="aurora-bg">
        <div className="aurora-item"></div>
        <div className="aurora-item"></div>
        <div className="aurora-item"></div>
      </div>

      {/* SIDEBAR */}
      <nav className={`gemini-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <button className="menu-toggle" onClick={() => setSidebarOpen(!isSidebarOpen)}>
          <svg viewBox="0 0 24 24" width="24"><path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
        </button>
        <div className="new-chat-btn">
          <svg viewBox="0 0 24 24" width="20"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          {isSidebarOpen && <span>New Chat</span>}
        </div>
        <div className="history-section">
          {isSidebarOpen && <p className="section-label">Recent</p>}
          <div className="history-item">
            <svg viewBox="0 0 24 24" width="18"><path fill="currentColor" d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H3V8h18v8z"/></svg>
            {isSidebarOpen && <span>Maya Project Build</span>}
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="gemini-main">
        <header className="gemini-header">
          <div className="model-selector">Maya Agentic 2.0 <svg viewBox="0 0 24 24" width="16"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg></div>
          <div className="user-profile">
            <div className="user-initial">{profile.name[0]}</div>
          </div>
        </header>

        <section className="chat-viewport" ref={scrollRef}>
          {messages.map((msg) => (
            <div key={msg.id} className={`gemini-row ${msg.sender}`}>
              {msg.sender === 'bot' && <BotAvatar status={isTyping ? 'thinking' : 'idle'} />}
              <div className="gemini-content">
                <p className="sender-name">{msg.sender === 'bot' ? 'Maya' : profile.name}</p>
                <div className="text-body">{msg.text}</div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="gemini-row bot">
              <BotAvatar status="thinking" />
              <div className="gemini-content"><div className="skeleton-loader"></div></div>
            </div>
          )}
        </section>

        <footer className="gemini-footer">
          <div className="input-pill">
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSend()}
              placeholder="Enter a prompt here" 
            />
            <div className="input-actions">
              <button onClick={() => recognition.current.start()} className={isListening ? 'listening' : ''}>
                <svg viewBox="0 0 24 24" width="24"><path fill="currentColor" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/></svg>
              </button>
              <button onClick={() => handleManualSend()}>
                <svg viewBox="0 0 24 24" width="24"><path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </div>
          </div>
          <p className="disclaimer">Maya may display inaccurate info, so double-check her responses.</p>
        </footer>
      </main>
    </div>
  );
}

export default App;