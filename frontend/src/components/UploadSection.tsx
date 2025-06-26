import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import FileModal from '../app/protected/chat/FileModal';

// Updated PDFData interface to match what NewChatPage expects
interface PDFData {
  name: string;
  size: number;
  type: string;
  fileId: string; // The unique ID for the file on the backend
  pdfUrl: string; // The URL to view the PDF
  summary: string; // Will be empty initially, populated by NewChatPage
  keyPoints: string[]; // Will be empty initially, populated by NewChatPage
  isLoadingSummary: boolean; // Will be true initially, managed by NewChatPage
  summaryError: string | null; // Will be null initially, managed by NewChatPage
}

interface UploadSectionProps {
  onFileUpload: (data: { name: string; size: number; type: string; id: string; url: string; }) => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onFileUpload }) => {
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);

  // This function will be called by FileModal when an upload is successful
  const handleFileModalUpload = (uploadedFile: { name: string; size: number; type: string; id: string; url: string; }) => {
    // Pass the uploaded file info directly to the onFileUpload prop from NewChatPage
    onFileUpload(uploadedFile);
    setIsFileModalOpen(false); // Close the modal after successful upload
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center ">
      <div className="text-center max-w-md mx-auto">
        <div className="bg-gray-800/30 p-8 rounded-2xl shadow-lg">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center">
            <Upload className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            Welcome to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">
              Navarya
            </span>
          </h1>
          <p className="text-gray-300 mb-6 leading-relaxed">
            Upload your PDF document to get started with AI-powered insights and interactive chat.
          </p>
          <button
            onClick={() => setIsFileModalOpen(true)}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-8 py-3 rounded-full font-medium hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 shadow-lg flex items-center mx-auto space-x-2"
          >
            <Upload size={20} />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      <FileModal
        isOpen={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
        onFileUpload={handleFileModalUpload} // Pass the new handler to FileModal
      />
    </div>
  );
};

export default UploadSection;