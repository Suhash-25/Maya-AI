import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const MessageBubble = ({ msg, setExpandedImage }) => {
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
            className="rounded-lg mb-2 cursor-pointer"
            onClick={() => setExpandedImage(msg.image)}
          />
        )}

        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline ? (
                <SyntaxHighlighter
                  style={oneDark}
                  language={match ? match[1] : "javascript"}
                  PreTag="div"
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code className="bg-slate-700 px-1 rounded">
                  {children}
                </code>
              );
            }
          }}
        >
          {msg.content}
        </ReactMarkdown>

        {msg.source && (
          <div className="text-xs mt-2 text-cyan-400">
            📡 {msg.source}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;