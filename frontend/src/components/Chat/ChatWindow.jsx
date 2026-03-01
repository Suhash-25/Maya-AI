import MessageBubble from "./MessageBubble";
import WelcomeScreen from "./WelcomeScreen";
import ThinkingSteps from "./ThinkingSteps";

const ChatWindow = ({
  history,
  loading,
  activeSteps,
  scrollRef,
  setExpandedImage,
}) => {
  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-6 space-y-2"
    >
      {history.length === 0 && <WelcomeScreen />}

      {history.map((msg, i) => (
        <MessageBubble
          key={i}
          msg={msg}
          setExpandedImage={setExpandedImage}
        />
      ))}

      {loading && <ThinkingSteps activeSteps={activeSteps} />}
    </div>
  );
};

export default ChatWindow;