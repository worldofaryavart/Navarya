import React, { useState } from 'react';
import { Upload, FileText, Sparkles } from 'lucide-react';
import FileModal from './FileModal';

interface UploadSectionProps {
  onFileUpload: (data: { name: string; size: number; type: string; id: string; url: string; }) => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onFileUpload }) => {
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);

  const handleFileModalUpload = (uploadedFile: { name: string; size: number; type: string; id: string; url: string; }) => {
    onFileUpload(uploadedFile);
    setIsFileModalOpen(false);
  };

  return (
    <>
      {/* Upload Card */}
      <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-indigo-500/30 transition-all duration-300 group">
        <div className="text-center">
          {/* Icon with animation */}
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Upload className="text-white" size={32} />
            </div>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="text-indigo-400 animate-pulse" size={20} />
            </div>
          </div>

          {/* Content */}
          <h3 className="text-2xl font-bold text-white mb-3">
            Upload Your Document
          </h3>
          <p className="text-gray-400 mb-6 leading-relaxed">
            Drag and drop your PDF or click to browse. Get instant AI insights and start chatting with your document.
          </p>

          {/* Upload Button */}
          <button
            onClick={() => setIsFileModalOpen(true)}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-8 py-4 rounded-xl font-medium hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center mx-auto space-x-3 group"
          >
            <Upload size={20} className="group-hover:rotate-12 transition-transform duration-200" />
            <span>Choose Document</span>
          </button>

          {/* Supported formats */}
          <div className="mt-6 pt-6 border-t border-gray-700/50">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <FileText size={16} />
              <span>Supports PDF files up to 10MB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        {[
          {
            icon: <Sparkles size={20} />,
            title: "AI Analysis",
            description: "Get instant insights"
          },
          {
            icon: <FileText size={20} />,
            title: "Smart Chat",
            description: "Ask questions naturally"
          },
          {
            icon: <Upload size={20} />,
            title: "Quick Upload",
            description: "Process in seconds"
          }
        ].map((feature, index) => (
          <div key={index} className="bg-gray-800/20 backdrop-blur-sm rounded-xl p-4 border border-gray-700/30 text-center">
            <div className="text-indigo-400 mb-2 flex justify-center">
              {feature.icon}
            </div>
            <h4 className="text-white font-medium text-sm mb-1">{feature.title}</h4>
            <p className="text-gray-400 text-xs">{feature.description}</p>
          </div>
        ))}
      </div>

      <FileModal
        isOpen={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
        onFileUpload={handleFileModalUpload}
      />
    </>
  );
};

export default UploadSection;