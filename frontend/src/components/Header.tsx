'use client';

import React from "react";

const Header = () => {
  return (
    <header className="bg-gray-800 border-b border-gray-700/50 shadow-lg p-4 flex justify-between items-center sticky top-0 z-40">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          AaryaI
        </h1>
      </div>
    </header>
  );
};

export default Header;