import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const BotAvatar = ({ status }) => (
  <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="avatar-container">
    <div className={`avatar-circle ${status}`}>
      <motion.div animate={{ scaleY: [1, 0.1, 1] }} transition={{ repeat: Infinity, duration: 3, times: [0, 0.1, 0.2] }} className="avatar-eye" />
    </div>
  </motion.div>
);

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userName, setUserName] = useState('User');
  const scrollRef = useRef(null);

  // FETCH PROFILE & WELCOME ON LOAD
  useEffect(() => {
    const initApp = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:8000/profile');
        setUserName(res.data.name);
        setMessages([{ 
          text: `Yo ${res.data.name}, Maya is online. What's the move?`, 
          sender: 'bot', 
          id: 'welcome' 
        }]);
      } catch (err) {
        console.error("Profile fetch failed");
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input;
    setMessages(prev => [...prev, { text: userText, sender: 'user', id: Date.now() }]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await axios.post('http://127.0.0.1:8000/chat', { message: userText });
      setMessages(prev => [...prev, { text: res.data.reply, sender: 'bot', id: Date.now() + 1 }]);
    } catch (err) {
      setMessages(prev => [...prev, { text: "Connection dropped.", sender: 'bot', id: 'err' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="premium-viewport">
      <div className="ambient-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <main className="full-screen-ui">
        <header className="premium-header">
          <div className="brand-group">
            <div className="status-indicator online"></div>
            <h1>MAYA AI // <span>{userName.toUpperCase()}</span></h1>
          </div>
        </header>

        <section className="scroll-viewport" ref={scrollRef}>
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <div key={msg.id} className={`message-row ${msg.sender}`}>
                {msg.sender === 'bot' && <BotAvatar status="idle" />}
                <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="premium-bubble">
                  {msg.text}
                </motion.div>
              </div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <div className="message-row bot">
              <BotAvatar status="active" />
              <div className="premium-bubble typing">
                <div className="typing-dots"><span></span><span></span><span></span></div>
              </div>
            </div>
          )}
        </section>

        <footer className="dock-container">
          <form onSubmit={sendMessage} className="premium-dock">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Message Maya...`} />
            <button type="submit" className="send-btn">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
}

export default App;