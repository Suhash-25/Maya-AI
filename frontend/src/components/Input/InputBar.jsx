import MicButton from "./MicButton";
import FilePreview from "./FilePreview";

const InputBar = ({
  input,
  setInput,
  sendMessage,
  isListening,
  handleMicClick,
  handleFileChange,
  attachedFile,
  setAttachedFile,
  fileInputRef,
  loading,
}) => {
  return (
    <div className="p-4 border-t border-white/10 bg-slate-900/60 backdrop-blur-md">
      <div className="flex items-center bg-slate-800 rounded-full px-4 py-2">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept="image/*"
        />

        <button onClick={() => fileInputRef.current?.click()} className="mr-2">
          📎
        </button>

        <MicButton isListening={isListening} onClick={handleMicClick} />

        <input
          className="flex-1 bg-transparent outline-none px-3"
          placeholder="Ask Maya anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-cyan-500 px-4 py-1 rounded-full text-black font-semibold"
        >
          Send
        </button>
      </div>

      <FilePreview
        attachedFile={attachedFile}
        removeFile={() => setAttachedFile(null)}
      />
    </div>
  );
};

export default InputBar;