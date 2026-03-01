import LoaderDots from "../UI/LoaderDots";

const ThinkingSteps = ({ activeSteps }) => {
  return (
    <div className="bg-slate-800 border border-white/10 p-4 rounded-2xl mb-4">
      {activeSteps.map((step) => (
        <div key={step.id} className="text-sm text-slate-300 mb-1">
          {step.icon} {step.status}
        </div>
      ))}
      <LoaderDots />
    </div>
  );
};

export default ThinkingSteps;