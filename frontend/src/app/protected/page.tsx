// pages/MainPage.tsx
"use client";

import { useState, useEffect } from "react"; // Adjust path as needed
import { auth } from "@/utils/config/firebase.config"; // Ensure correct path
import { useRouter } from "next/navigation"; // For Next.js App Router
import UploadSection from "@/components/UploadSection";
import PreviousProjects from "@/components/PreviousProject";
// If using Next.js Pages Router: import { useRouter } from 'next/router';

interface Project {
  id: string; // Backend ID for the project/document entry
  name: string;
  uploadDate: string;
  fileId: string; // The unique ID for the file on the backend storage/processing
  pdfUrl: string; // URL for the PDF
}

const MainPage = () => {
  const router = useRouter();
  const [previousProjects, setPreviousProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreviousProjects = async () => {
      setIsLoadingProjects(true);
      setProjectsError(null);
      try {
        const user = auth.currentUser;
        if (!user) {
          // Redirect to login if not authenticated, or handle gracefully
          console.warn("User not authenticated. Cannot fetch projects.");
          setIsLoadingProjects(false);
          return;
        }
        const token = await user.getIdToken();

        const response = await fetch("http://localhost:8000/api/documents", {
          // Your backend endpoint
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.detail || "Failed to fetch previous projects."
          );
        }

        const data = await response.json();
        setPreviousProjects(data); // Assuming data is an array of Project objects
      } catch (error: any) {
        console.error("Error fetching previous projects:", error);
        setProjectsError(error.message || "Unknown error fetching projects.");
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchPreviousProjects();
  }, []);

  const handleFileUpload = async (uploadedFile: {
    name: string;
    size: number;
    type: string;
    id: string;
    url: string;
  }) => {
    console.log("PDF data received in MainPage from new upload:", uploadedFile);
    // After a successful upload, navigate to the NewChatPage with the fileId
    // You might want to pass more initial data, but fileId is crucial for NewChatPage to fetch
    router.push(`/protected/chat?fileId=${uploadedFile.id}`);
  };

  const handleSelectPreviousProject = (fileId: string) => {
    console.log("Selected previous project with fileId:", fileId);
    // Navigate to the NewChatPage with the selected fileId
    router.push(`/protected/chat?fileId=${fileId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">
        Welcome to Navarya
      </h1>
      <p className="text-lg text-gray-300 mb-2 text-center max-w-2xl">
        Upload a new PDF or continue with a previous project.
      </p>

      <h2 className="text-2xl font-semibold text-white">
        Upload New Document
      </h2>
      <UploadSection onFileUpload={handleFileUpload} />

      {/* Previous Projects Section */}
      <PreviousProjects
        onSelectProject={handleSelectPreviousProject}
        projects={previousProjects}
        isLoading={isLoadingProjects}
        error={projectsError}
      />
    </div>
  );
};

export default MainPage;
