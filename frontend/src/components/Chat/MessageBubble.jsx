import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const MessageBubble = ({ msg, setExpandedImage }) => {
  if (!msg || !msg.role) return null;

  const isUser = msg.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-2xl p-4 rounded-2xl ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-slate-800 border border-white/10"
        }`}
      >
        {msg.image && (
          <img
            src={msg.image}
            alt="Uploaded content"
            className="rounded-lg mb-2 cursor-zoom-in hover:opacity-90 transition-opacity"
            onClick={() => setExpandedImage(msg.image)}
          />
        )}

        {/* THE FIX: Wrap ReactMarkdown in a div instead of passing className directly */}
        <div className="markdown-body">
          <ReactMarkdown
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                
                return match ? (
                  <div className="rounded-md overflow-hidden my-2">
                    <div className="bg-gray-900 text-gray-400 text-xs px-3 py-1 uppercase font-sans tracking-wider border-b border-gray-700">
                      {match[1]}
                    </div>
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{ margin: 0, borderRadius: "0 0 6px 6px" }}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code {...props} className="bg-slate-700 text-pink-300 px-1.5 py-0.5 rounded text-sm font-mono">
                    {children}
                  </code>
                );
              }
            }}
          >
            {msg.content || " "}
          </ReactMarkdown>
        </div>

        {msg.source && (
          <div className="text-xs mt-2 text-cyan-400 font-semibold tracking-wide">
            📡 {msg.source}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;