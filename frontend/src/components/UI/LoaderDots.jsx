const LoaderDots = () => {
  return (
    <div className="flex space-x-1 mt-2">
      <span className="w-2 h-2 bg-white rounded-full animate-bounce" />
      <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-150" />
      <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-300" />
    </div>
  );
};

export default LoaderDots;