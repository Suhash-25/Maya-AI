const MicButton = ({ isListening, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 ${
        isListening ? "text-red-500 animate-pulse" : "text-white"
      }`}
    >
      🎤
    </button>
  );
};

export default MicButton;