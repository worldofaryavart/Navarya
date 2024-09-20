import React from "react";
import LearningMode from "./LearningMode";
import LearningSpace from "./LearningSpace/LearningSpace";

const Learning: React.FC = () => {
  return (
    <div>
      {/* <h1 className="text-2xl font-bold mb-4">Learning Mode</h1> */}
      {/* Add your learning mode content here */}
      <LearningSpace/>
      {/* <div className="min-h-screen bg-gray-100">
        <LearningMode />
      </div> */}
    </div>
  );
};

export default Learning;
