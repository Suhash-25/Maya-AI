export const useSpeechSynthesis = () => {
  const speak = (text) => {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    const femaleVoice = voices.find(
      (v) => v.name.includes("Female") || v.name.includes("Zira")
    );

    if (femaleVoice) utterance.voice = femaleVoice;

    window.speechSynthesis.speak(utterance);
  };

  return speak;
};