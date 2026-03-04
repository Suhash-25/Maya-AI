import { useState } from "react";

const Sidebar = ({
  chats,
  activeChatId,
  setActiveChatId,
  setChats
}) => {
  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: "New Chat",
      messages: []
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  };

  const deleteChat = (id) => {
    const filtered = chats.filter(c => c.id !== id);
    setChats(filtered);
    if (filtered.length > 0) {
      setActiveChatId(filtered[0].id);
    }
  };

  const renameChat = (id) => {
    const newTitle = prompt("Rename chat:");
    if (!newTitle) return;
    setChats(prev =>
      prev.map(chat =>
        chat.id === id ? { ...chat, title: newTitle } : chat
      )
    );
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-white/10 p-4 flex flex-col">
      <button
        onClick={createNewChat}
        className="bg-cyan-500 text-black font-semibold py-2 rounded-lg mb-4"
      >
        + New Chat
      </button>

      <div className="flex-1 overflow-y-auto space-y-2">
        {chats.map(chat => (
          <div
            key={chat.id}
            className={`p-3 rounded-lg cursor-pointer ${
              chat.id === activeChatId
                ? "bg-slate-700"
                : "bg-slate-800 hover:bg-slate-700"
            }`}
            onClick={() => setActiveChatId(chat.id)}
          >
            <div className="flex justify-between items-center">
              <span className="truncate">{chat.title}</span>
              <div className="flex gap-1 text-xs">
                <button onClick={(e) => { e.stopPropagation(); renameChat(chat.id); }}>✏️</button>
                <button onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}>🗑</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;