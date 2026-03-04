import { useEffect } from "react";

export const useAutoScroll = (ref, deps) => {
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, deps);
};