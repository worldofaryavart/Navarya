import { useState, useRef, ChangeEvent } from "react";
import { Upload, FileText, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { auth } from "@/utils/config/firebase.config";
import { getApiUrl } from "@/utils/config/api.config";

// Define the types for file objects
interface FileData {
  id: string; // The unique ID given by the frontend before upload
  file: File;
  type: string;
  name: string;
  size: number;
  uploaded: boolean;
}

// Define the type for information about a successfully uploaded file
interface UploadedFileInfo {
  name: string;
  size: number;
  type: string;
  id: string; // This will be the backend's unique_filename
  url: string; // The URL to access the uploaded file
}

interface FileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (uploadedFile: UploadedFileInfo) => void; // Add this prop
}

const FileModal = ({ isOpen, onClose, onFileUpload }: FileModalProps) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: FileData[] = Array.from(e.target.files).map((file) => ({
        id: Math.random().toString(36).substring(2), // Frontend unique ID
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

  const getAuthToken = async (): Promise<string> => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }
    return await user.getIdToken();
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError("");
    setUploadProgress(0);

    try {
      const token = await getAuthToken();

      const formData = new FormData();
      files.forEach((fileObj) => {
        formData.append("files", fileObj.file);
      });

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

      const response = await fetch(getApiUrl("/api/upload"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);

      const contentType = response.headers.get("content-type");

      if (!response.ok) {
        let errorMessage = "Error uploading files";

        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } catch (jsonError) {
            console.error("Failed to parse error response as JSON:", jsonError);
          }
        } else {
          const htmlText = await response.text();
          console.error("Server returned HTML instead of JSON:", htmlText);

          if (response.status === 404) {
            errorMessage = "Upload endpoint not found. Please check your API configuration.";
          } else if (response.status >= 500) {
            errorMessage = "Server error occurred. Please try again later.";
          } else if (response.status === 401) {
            errorMessage = "Authentication failed. Please login again.";
          } else {
            errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
          }
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Upload successful:", result);

      setUploadProgress(100);
      setFiles((prevFiles) =>
        prevFiles.map((file) => ({ ...file, uploaded: true }))
      );

      // Call the onFileUpload prop with the details of the first uploaded file
      // Your backend returns a list of files, so we'll pick the first one for simplicity.
      if (result.files && result.files.length > 0) {
        const uploadedFile = result.files[0];
        onFileUpload({
          name: uploadedFile.name,
          size: uploadedFile.size,
          type: uploadedFile.type,
          id: uploadedFile.id, // The backend's generated ID for the file
          url: uploadedFile.url, // The URL to access the file
        });
      }

      // Automatically close modal after a short delay on success
      setTimeout(() => {
        setUploadProgress(0);
        setFiles([]);
        onClose(); 
      }, 2000);

    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <ImageIcon className="text-blue-400" size={20} />;
    } else if (fileType.includes("pdf")) {
      return <FileText className="text-red-400" size={20} />;
    } else {
      return <FileText className="text-yellow-400" size={20} />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 overflow-y-auto">
      <div className="w-full max-w-md md:max-w-lg bg-gray-800 rounded-lg shadow-lg overflow-hidden relative m-4">
        {/* Header with close button */}
        <div className="flex items-center justify-between bg-gray-700 px-4 py-3">
          <h2 className="text-lg font-semibold text-white">Upload Files</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          <div
            className="border-2 border-dashed border-gray-600 rounded-lg p-6 mb-5 cursor-pointer hover:border-blue-400 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center justify-center text-center">
              <Upload className="text-gray-400 mb-3" size={32} />
              <p className="text-base mb-1">
                Drag and drop files here or click to browse
              </p>
              <p className="text-sm text-gray-400">
                Support for PDFs, documents, and images
              </p>
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
            <div className="mb-5">
              <h3 className="text-sm font-medium mb-2 text-gray-300">Selected Files</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between bg-gray-700 rounded-lg p-2"
                  >
                    <div className="flex items-center">
                      {getFileIcon(file.type)}
                      <div className="ml-3">
                        <p className="text-sm truncate max-w-xs">{file.name}</p>
                        <p className="text-xs text-gray-400">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="text-gray-400 hover:text-red-400"
                      disabled={uploading}
                    >
                      <X size={16} />
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
              <p className="text-sm text-gray-400 mt-1 text-right">
                {uploadProgress}%
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium bg-gray-700 text-gray-300 hover:bg-gray-600"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              onClick={uploadFiles}
              disabled={files.length === 0 || uploading}
              className={`flex items-center px-4 py-2 rounded-lg font-medium ${
                files.length === 0 || uploading
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 text-white"
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2" size={16} />
                  Upload
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileModal;
