const FilePreview = ({ attachedFile, removeFile }) => {
  if (!attachedFile) return null;

  return (
    <div className="text-xs text-cyan-400 flex items-center gap-2">
      Image Attached
      <button onClick={removeFile}>×</button>
    </div>
  );
};

export default FilePreview;