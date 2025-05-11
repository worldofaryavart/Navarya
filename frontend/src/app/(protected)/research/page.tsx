"use client";

import { useState, useRef, ChangeEvent } from 'react';
import { Upload, FileText, Image, X, Loader2 } from 'lucide-react';

// Define the types for file objects
interface FileData {
  id: string;
  file: File;
  type: string;
  name: string;
  size: number;
  uploaded: boolean;
}

const ResearchAgent = () => {
  const [files, setFiles] = useState<FileData[]>([]); // Use the FileData type for the files state
  const [uploading, setUploading] = useState<boolean>(false); // Type for uploading state
  const [uploadProgress, setUploadProgress] = useState<number>(0); // Type for uploadProgress
  const [error, setError] = useState<string>(''); // Type for error message
  const fileInputRef = useRef<HTMLInputElement | null>(null); // Type for file input ref

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: FileData[] = Array.from(e.target.files).map((file) => ({
        id: Math.random().toString(36).substring(2),
        file,
        type: file.type,
        name: file.name,
        size: file.size,
        uploaded: false,
      }));
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
  };

  const uploadFiles = async () => {
    console.log("uploadFiles is clicked");
    if (files.length === 0) return;

    setUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      files.forEach((fileObj) => {
        formData.append('files', fileObj.file);
      });

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 10;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 300);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error uploading files');
      }

      setUploadProgress(100);
      setFiles((prevFiles) =>
        prevFiles.map((file) => ({ ...file, uploaded: true }))
      );

      setTimeout(() => {
        setUploadProgress(0);
        setFiles([]);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="text-blue-400" size={20} />;
    } else if (fileType.includes('pdf')) {
      return <FileText className="text-red-400" size={20} />;
    } else {
      return <FileText className="text-yellow-400" size={20} />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-900 text-white p-8 mt-16">
      <h1 className="text-4xl font-bold mb-8">Research Agent</h1>

      <div className="w-full max-w-2xl bg-gray-800 rounded-lg p-8 shadow-lg">
        <h2 className="text-2xl font-semibold mb-6">Upload Research Materials</h2>

        <div
          className="border-2 border-dashed border-gray-600 rounded-lg p-8 mb-6 cursor-pointer hover:border-blue-400 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <Upload className="text-gray-400 mb-4" size={40} />
            <p className="text-lg mb-2">Drag and drop files here or click to browse</p>
            <p className="text-sm text-gray-400">Support for PDFs, documents, and images</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              className="hidden"
              multiple
            />
          </div>
        </div>

        {files.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Selected Files</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center">
                    {getFileIcon(file.type)}
                    <div className="ml-3">
                      <p className="text-sm truncate max-w-xs">{file.name}</p>
                      <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 text-red-200 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {uploadProgress > 0 && (
          <div className="mb-4">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-400 mt-1 text-right">{uploadProgress}%</p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={uploadFiles}
            disabled={files.length === 0 || uploading}
            className={`flex items-center px-6 py-2 rounded-lg font-medium ${
              files.length === 0 || uploading
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2" size={18} />
                Upload Files
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResearchAgent;
