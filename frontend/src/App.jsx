import React, { useState, useEffect, useRef, Suspense } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float } from '@react-three/drei';
import './App.css';

// --- 3D BACKGROUND COMPONENT (Three.js) ---
function Scene() {
  const sphereRef = useRef();
  // Makes the orb pulsate and rotate slightly
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    sphereRef.current.rotation.set(t / 4, t / 3, 0);
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={sphereRef} args={[1, 100, 200]} scale={2.2}>
        <MeshDistortMaterial
          color="#8b5cf6"
          attach="material"
          distort={0.4}
          speed={4}
          roughness={0}
          metalness={1}
        />
      </Sphere>
    </Float>
  );
}

// --- REACT BITS STYLE TEXT REVEAL ---
const DecryptedText = ({ text }) => {
  const [display, setDisplay] = useState('');
  const chars = 'ABCDEFGHIJKLMN0123456789!@#$%^&*';

  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplay(text.split('')
        .map((char, index) => {
          if (index < iteration) return text[index];
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('')
      );
      if (iteration >= text.length) clearInterval(interval);
      iteration += 1 / 3;
    }, 30);
    return () => clearInterval(interval);
  }, [text]);

  return <span>{display}</span>;
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
      setMessages(prev => [...prev, { text: "CORE_OFFLINE: Link severed.", sender: 'bot', id: 'err' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="app-container">
      {/* THREE.JS LAYER */}
      <div className="canvas-wrapper">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <Suspense fallback={null}>
            <ambientLight intensity={1} />
            <pointLight position={[10, 10, 10]} intensity={2} />
            <Scene />
          </Suspense>
        </Canvas>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ui-overlay">
        <header className="maya-header">
          <div className="logo-glow"></div>
          <h2>MAYA AI</h2>
        </header>

        <div className="chat-viewport" ref={scrollRef}>
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: msg.sender === 'user' ? 100 : -100, filter: 'blur(10px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                className={`msg-row ${msg.sender}`}
              >
                <div className="glass-bubble">
                  {msg.sender === 'bot' ? <DecryptedText text={msg.text} /> : msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <form onSubmit={sendMessage} className="input-container">
          <input 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            placeholder="What's on your mind?" 
          />
          <button type="submit">Execute</button>
        </form>
      </motion.div>
    </div>
  );
}

export default App;