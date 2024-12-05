import React from "react";

interface LoaderProps {
  action?: string;
}

const Loader: React.FC<LoaderProps> = ({ action = "Loading" }) => {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-opacity-0"
      role="status"
      aria-live="polite"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }} // Slight overlay for better visibility
    >
      <div className="flex flex-col items-center">
        <div
          className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-400 mb-4"
          aria-hidden="true"
        ></div>
        {/* <h2 className="text-xl font-bold text-blue-400">{action}</h2> */}
      </div>
    </div>
  );
};

export default Loader;
