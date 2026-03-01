import axios from "axios";

export const sendChatMessage = async (message, image) => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

  const { data } = await axios.post(API_URL + "/chat", {
    message,
    image,
  });

  return data;
};