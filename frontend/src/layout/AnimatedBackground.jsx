import { motion } from "framer-motion";

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-950">
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 20, repeat: Infinity }}
        className="absolute w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl top-20 left-20"
      />
      <motion.div
        animate={{ scale: [1.2, 1, 1.2] }}
        transition={{ duration: 25, repeat: Infinity }}
        className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl bottom-20 right-20"
      />
    </div>
  );
};

export default AnimatedBackground;