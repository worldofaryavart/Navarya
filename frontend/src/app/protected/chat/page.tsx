// pages/new-chat/page.tsx (for Next.js App Router)
// If using Next.js Pages Router, it would be pages/new-chat.tsx
"use client";

import { Upload } from "lucide-react";// Adjust path as needed
import { useState, useEffect } from "react";
import { auth } from "@/utils/config/firebase.config"; // Ensure correct path
import { useRouter, useSearchParams } from 'next/navigation'; // For Next.js App Router
import PDFSummary from "@/components/chat/PDFSummary";
import PDFViewer from "@/components/chat/PDFViewer";
import AIChat from "@/components/chat/AIChat2";
import { getApiUrl } from "@/utils/config/api.config";
// If using Next.js Pages Router: import { useRouter } from 'next/router';

// Updated PDFData interface
interface PDFData {
  name: string;
  size: number;
  type: string;
  fileId: string; // The unique ID for the file on the backend
  pdfUrl: string; // The URL to view the PDF
  summary: string;
  keyPoints: string[];
  isLoadingSummary: boolean;
  summaryError: string | null;
}

const NewChatPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams(); // For Next.js App Router
  // If using Next.js Pages Router: const router = useRouter(); const { fileId } = router.query;

  const [pdfData, setPdfData] = useState<PDFData | null>(null);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [initialDataError, setInitialDataError] = useState<string | null>(null);

  useEffect(() => {
    const fileId = searchParams.get('fileId'); // For Next.js App Router
    // If using Next.js Pages Router: const fileId = router.query.fileId as string;

    if (!fileId) {
      setInitialDataError("No document ID provided. Please go back to the main page.");
      setLoadingInitialData(false);
      return;
    }

    const fetchPdfDetails = async () => {
      setLoadingInitialData(true);
      setInitialDataError(null);
      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error("User not authenticated to load document.");
        }
        const token = await user.getIdToken();

        // Fetch the full details of the document using its fileId
        const response = await fetch(getApiUrl(`/api/documents/${fileId}`), {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to load document details.");
        }

        const documentDetails = await response.json();
        console.log("Fetched document details for NewChatPage:", documentDetails);

        setPdfData({
          name: documentDetails.name,
          size: documentDetails.size, // Assuming backend provides size
          type: documentDetails.type, // Assuming backend provides type
          fileId: documentDetails.fileId,
          pdfUrl: documentDetails.pdfUrl,
          summary: documentDetails.summary || "Generating summary...", // Provide a default if not ready
          keyPoints: documentDetails.keyPoints || [],
          isLoadingSummary: documentDetails.summary === null || documentDetails.keyPoints.length === 0, // Check if summary is still loading
          summaryError: documentDetails.summaryError || null, // If backend indicates an error
        });

        // If summary wasn't ready, trigger generation if needed
        if (documentDetails.summary === null || documentDetails.keyPoints.length === 0) {
          triggerSummaryGeneration(fileId);
        }

      } catch (error: any) {
        console.error("Error fetching initial PDF details:", error);
        setInitialDataError(error.message || "Failed to load document.");
      } finally {
        setLoadingInitialData(false);
      }
    };

    const triggerSummaryGeneration = async (id: string) => {
        // Update state to show loading while summary is generated
        setPdfData(prev => prev ? { ...prev, isLoadingSummary: true, summaryError: null } : null);
        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error("User not authenticated for summary generation.");
            }
            const token = await user.getIdToken();

            const response = await fetch(getApiUrl(`/api/summarize-document/${id}`), {
                method: "GET", // Or POST if it's an action
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to generate summary.");
            }

            const summaryResult = await response.json();
            console.log("AI Summary Result:", summaryResult);

            setPdfData(prev => prev ? {
                ...prev,
                summary: summaryResult.summary,
                keyPoints: summaryResult.keyPoints,
                isLoadingSummary: false,
                summaryError: null,
            } : null);

        } catch (error: any) {
            console.error("Error generating AI summary:", error);
            setPdfData(prev => prev ? {
                ...prev,
                summary: "Failed to generate AI summary.",
                keyPoints: [],
                isLoadingSummary: false,
                summaryError: error.message || "Unknown error during summary generation.",
            } : null);
        }
    };

    if (fileId) {
      fetchPdfDetails();
    }

  }, [searchParams]); // Depend on searchParams for App Router
  // If using Next.js Pages Router: }, [router.query.fileId]);


  if (loadingInitialData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p>Loading document...</p>
      </div>
    );
  }

  if (initialDataError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-red-400 p-4">
        <p>{initialDataError}</p>
        <button
          onClick={() => router.push('/')} // Navigate back to MainPage
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          Go to Main Page
        </button>
      </div>
    );
  }

  // If pdfData is still null after loading (e.g., fileId was missing or error), show fallback
  if (!pdfData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-gray-400 p-4">
        <p>No PDF data available. Please go back and select a document.</p>
        <button
          onClick={() => router.push('/')} // Navigate back to MainPage
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          Go to Main Page
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700/50 p-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">
              Navarya
            </span>
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Left Panel - Summary and PDF */}
          <div className="w-[40rem] bg-gray-800/30 border-r border-gray-700/50 p-4 overflow-y-auto">
            <div className="space-y-4">
              <PDFSummary pdfData={pdfData} />
              <PDFViewer pdfData={pdfData} />
            </div>
          </div>

          {/* Right Panel - Chat */}
          <div className="flex-1 flex flex-col">
            <AIChat pdfData={pdfData} />
          </div>
        </div>
      </div>

      <style jsx global>{`
        .message-item {
          animation: fadeInUp 0.4s ease-out forwards;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        textarea {
          scrollbar-width: none;
        }
        textarea::-webkit-scrollbar {
          display: none;
        }
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.3);
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.5);
          border-radius: 3px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.7);
        }
      `}</style>
    </div>
  );
};

export default NewChatPage;