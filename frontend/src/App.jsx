import { useState, useRef, useEffect } from "react";
import AnimatedBackground from "./layout/AnimatedBackground";
import Header from "./layout/Header";
import Sidebar from "./layout/Sidebar";
import ChatWindow from "./components/Chat/ChatWindow";
import InputBar from "./components/Input/InputBar";
import Lightbox from "./components/UI/Lightbox";

import { sendChatMessage } from "./services/chatService";
import { convertToBase64 } from "./utils/fileUtils";
import { useSpeechRecognition } from "./hooks/useSpeechRecognition";
import { useAutoScroll } from "./hooks/useAutoScroll";
import { useSpeechSynthesis } from "./hooks/useSpeechSynthesis";

function App() {
  /* -------------------- GLOBAL STATES -------------------- */

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeSteps, setActiveSteps] = useState([]);
  const [expandedImage, setExpandedImage] = useState(null);
  const [attachedFile, setAttachedFile] = useState(null);

  /* -------------------- MULTI CHAT STATE -------------------- */

  const [chats, setChats] = useState(() => {
  const saved = localStorage.getItem("maya_chats");
  return saved
    ? JSON.parse(saved)
    : [{ id: 1, title: "New Chat", messages: [] }];
});

const [activeChatId, setActiveChatId] = useState(() => {
  const savedActive = localStorage.getItem("maya_active_chat");
  return savedActive ? JSON.parse(savedActive) : 1;
});

useEffect(() => {
  localStorage.setItem("maya_chats", JSON.stringify(chats));
}, [chats]);

useEffect(() => {
  localStorage.setItem("maya_active_chat", JSON.stringify(activeChatId));
}, [activeChatId]);

  const activeChat = chats.find(chat => chat.id === activeChatId);

  /* -------------------- REFS -------------------- */

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  /* -------------------- CUSTOM HOOKS -------------------- */

  const recognitionRef = useSpeechRecognition(setInput, setIsListening);
  const speak = useSpeechSynthesis();
  useAutoScroll(scrollRef, [activeChat?.messages, loading, activeSteps]);

  /* -------------------- SEND MESSAGE -------------------- */

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    let base64Image = null;
    let imagePreview = null;

    if (attachedFile && attachedFile.type.startsWith("image/")) {
      imagePreview = URL.createObjectURL(attachedFile);
      base64Image = await convertToBase64(attachedFile);
    }

    /* ---- Add USER message to active chat ---- */
    setChats(prev =>
      prev.map(chat =>
        chat.id === activeChatId
          ? {
              ...chat,
              messages: [
                ...chat.messages,
                { role: "user", content: input, image: imagePreview }
              ]
            }
          : chat
      )
    );

    const currentInput = input;
    setInput("");
    setAttachedFile(null);
    setLoading(true);
    setActiveSteps([]);

    try {
      /* ---- API CALL (UNCHANGED) ---- */
      const data = await sendChatMessage(currentInput, base64Image);

      if (data.steps) {
        setActiveSteps(data.steps);
      }

      setTimeout(() => {
        /* ---- Add MAYA reply to active chat ---- */
        setChats(prev =>
          prev.map(chat =>
            chat.id === activeChatId
              ? {
                  ...chat,
                  messages: [
                    ...chat.messages,
                    {
                      role: "maya",
                      content: data.reply || data.response,
                      source: data.source
                    }
                  ]
                }
              : chat
          )
        );

        speak(data.reply || data.response);
        setLoading(false);
        setActiveSteps([]);
      }, 800);

    } catch (error) {
      console.error("Maya Offline", error);
      setLoading(false);
    }
  };

  /* -------------------- MIC HANDLER -------------------- */

  const handleMicClick = () => {
    setIsListening(true);
    recognitionRef.current?.start();
  };

  /* -------------------- FILE HANDLER -------------------- */

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setAttachedFile(file);
  };

  /* -------------------- RENDER -------------------- */

  return (
    <div className="h-screen flex text-white">
      <AnimatedBackground />

      {/* -------- Sidebar -------- */}
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        setActiveChatId={setActiveChatId}
        setChats={setChats}
      />

      {/* -------- Main Chat Area -------- */}
      <div className="flex flex-col flex-1 relative">
        <Lightbox
          expandedImage={expandedImage}
          setExpandedImage={setExpandedImage}
        />

        <Header />

        <ChatWindow
          history={activeChat?.messages || []}
          loading={loading}
          activeSteps={activeSteps}
          scrollRef={scrollRef}
          setExpandedImage={setExpandedImage}
        />

        <InputBar
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          isListening={isListening}
          handleMicClick={handleMicClick}
          handleFileChange={handleFileChange}
          attachedFile={attachedFile}
          setAttachedFile={setAttachedFile}
          fileInputRef={fileInputRef}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default App;