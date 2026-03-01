import { motion, AnimatePresence } from "framer-motion";

const Lightbox = ({ expandedImage, setExpandedImage }) => {
  return (
    <AnimatePresence>
      {expandedImage && (
        <motion.div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setExpandedImage(null)}
        >
          <motion.img
            src={expandedImage}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            className="max-h-[90vh] rounded-xl"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Lightbox;