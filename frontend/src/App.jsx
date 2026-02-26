import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [activeSteps, setActiveSteps] = useState([]);
  const [expandedImage, setExpandedImage] = useState(null);
  const scrollRef = useRef(null);

  // Auto-scroll to the newest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeSteps, isThinking]);

  // Handle Image Selection and Base64 Conversion
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1];
        setAttachedImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Web Speech API for Voice Input
  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
      };
      recognition.start();
    } else {
      alert('Voice input is not supported in this browser.');
    }
  };

  // Trigger Backend API
  const sendMessage = async () => {
    if (!input.trim() && !attachedImage) return;

    // Build the user message object
    const newUserMsg = {
      role: 'user',
      text: input,
      image: attachedImage ? `data:image/jpeg;base64,${attachedImage}` : null
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInput('');

    const payloadImage = attachedImage;
    setAttachedImage(null);
    setIsThinking(true);
    setActiveSteps([{ id: 0, status: 'Initializing Maya Engine...', icon: '⚙️' }]);

    try {
      const response = await fetch('http://127.0.0.1:8080/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newUserMsg.text, image: payloadImage })
      });

      // SAFEGUARD: Check if the backend failed BEFORE trying to parse JSON
      if (!response.ok) {
        throw new Error(`Backend returned status ${response.status}`);
      }

      const data = await response.json();

      if (data.steps) setActiveSteps(data.steps);

      setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
    } catch (error) {
      console.error("Maya Core Error:", error);
      setMessages(prev => [...prev, {
        role: 'bot',
        text: `⚠️ **Connection Error:** ${error.message}. Please check your terminal to ensure the Python backend is running without errors.`
      }]);
    } finally {
      setIsThinking(false);
      setActiveSteps([]);
    }
  };

  return (
    <div className="app-container">

      {/* Lightbox UI for expanding images */}
      <AnimatePresence>
        {expandedImage && (
          <motion.div
            className="lightbox-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedImage(null)}
          >
            <motion.img
              src={expandedImage}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="lightbox-image"
            />
            <button className="lightbox-close" onClick={() => setExpandedImage(null)}>×</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="aurora-bg"></div>

      <main className="chat-container">
        <header className="chat-header">
          <h1>MAYA AI</h1>
          <span className="status-indicator"></span>
        </header>

        <div className="chat-window" ref={scrollRef}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              className={`message-bubble ${msg.role}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Render User Uploaded Images */}
              {msg.image && (
                <div className="chat-image-container">
                  <img
                    src={msg.image}
                    alt="User upload"
                    className="chat-inline-image clickable"
                    onClick={() => setExpandedImage(msg.image)}
                  />
                </div>
              )}

              {/* Advanced Markdown Rendering for Maya's Responses */}
              {msg.role === 'bot' ? (
                <ReactMarkdown
                  className="markdown-body"
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code(props) {
                      const { children, className, node, ...rest } = props;
                      // Safely check if this is a language block or just inline code
                      const match = /language-(\w+)/.exec(className || '');

                      return match ? (
                        <div className="code-block-container">
                          <div className="code-block-header">
                            <span>{match[1]}</span>
                          </div>
                          <SyntaxHighlighter
                            {...rest}
                            style={vscDarkPlus || {}} // Fallback to prevent undefined style crashes
                            language={match[1]}
                            PreTag="div"
                            customStyle={{ margin: 0, borderRadius: '0 0 8px 8px' }}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        <code {...rest} className={className ? `${className} inline-code` : 'inline-code'}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {/* The || '' prevents a crash if the backend ever returns null/undefined */}
                  {msg.text || ''}
                </ReactMarkdown>
              ) : (
                <p>{msg.text || ''}</p>
              )}
            </motion.div>
          ))}

          {/* Thinking Steps UI */}
          {isThinking && (
            <div className="thinking-container">
              {activeSteps.map((step, idx) => (
                <motion.div
                  key={idx}
                  className="thinking-step"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <span className="step-icon">{step.icon}</span>
                  <span className="step-text">{step.status}</span>
                </motion.div>
              ))}
              <motion.div
                className="typing-indicator"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                Maya is synthesizing...
              </motion.div>
            </div>
          )}
        </div>

        {/* Bottom Input Area */}
        <div className="input-area">
          {attachedImage && (
            <div className="attachment-preview">
              <img src={`data:image/jpeg;base64,${attachedImage}`} alt="preview" />
              <button onClick={() => setAttachedImage(null)}>✕</button>
            </div>
          )}
          <div className="input-bar">
            <label className="icon-btn">
              📎
              <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
            </label>
            <button className="icon-btn" onClick={startVoiceInput} title="Use Voice Input">🎤</button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask Maya anything..."
            />
            <button className="send-btn" onClick={sendMessage}>Send</button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;