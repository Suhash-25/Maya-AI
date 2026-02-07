import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const BotAvatar = ({ status }) => {
  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="avatar-container"
    >
      <div className={`avatar-circle ${status}`}>
        {/* Simplified "Maya" Persona Eye */}
        <motion.div 
          animate={{ scaleY: [1, 0.1, 1] }} 
          transition={{ repeat: Infinity, duration: 3, times: [0, 0.1, 0.2] }}
          className="avatar-eye" 
        />
      </div>
    </motion.div>
  );
};

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

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
      setMessages(prev => [...prev, { text: "Link severed. Check Core.", sender: 'bot', id: 'err' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="premium-viewport">
      {/* ANIMATED AMBIENT BACKGROUND */}
      <div className="ambient-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <main className="full-screen-ui">
        <header className="premium-header">
          <motion.div whileHover={{ scale: 1.05 }} className="brand-group">
            <div className="status-indicator online"></div>
            <h1>MAYA <span>AI</span></h1>
          </motion.div>
        </header>

        <section className="scroll-viewport" ref={scrollRef}>
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <div key={msg.id} className={`message-row ${msg.sender}`}>
                {msg.sender === 'bot' && <BotAvatar status="idle" />}
                
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  className="premium-bubble"
                >
                  {msg.text}
                </motion.div>
              </div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <div className="message-row bot">
              <BotAvatar status="active" />
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="premium-bubble typing"
              >
                <div className="typing-dots"><span></span><span></span><span></span></div>
              </motion.div>
            </div>
          )}
        </section>

        <footer className="dock-container">
          <form onSubmit={sendMessage} className="premium-dock">
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              placeholder="Query Maya..." 
            />
            <motion.button 
              whileTap={{ scale: 0.9 }} 
              type="submit" 
              className="send-btn"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </motion.button>
          </form>
        </footer>
      </main>
    </div>
  );
}

export default App;