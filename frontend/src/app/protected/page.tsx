// pages/MainPage.tsx
"use client";

import { useState, useEffect } from "react";
import { auth } from "@/utils/config/firebase.config";
import { useRouter } from "next/navigation";
import UploadSection from "@/components/UploadSection";
import PreviousProjects from "@/components/PreviousProject";
import { getApiUrl } from "@/utils/config/api.config";

interface Project {
  id: string;
  original_name: string;
  uploaded_at: string;
  fileId: string;
  pdfUrl: string;
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
          console.warn("User not authenticated. Cannot fetch projects.");
          setIsLoadingProjects(false);
          return;
        }
        const token = await user.getIdToken();

        const response = await fetch(getApiUrl("/api/documents"), {
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
        setPreviousProjects(data?.documents);
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
    router.push(`/protected/chat?fileId=${uploadedFile.id}`);
  };

  const handleSelectPreviousProject = (fileId: string) => {
    console.log("Selected previous project with fileId:", fileId);
    router.push(`/protected/chat?fileId=${fileId}`);
  };

  console.log("previous projects:", previousProjects);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-blue-500/10"></div>
        <div className="absolute top-0 right-0 w-86 h-86 bg-gradient-to-bl from-indigo-500/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-86 h-86 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-3xl"></div>
        
        <div className="relative z-10 text-center py-16 px-2">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400">
              Navarya
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Transform your documents with AI-powered insights and interactive conversations
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-16 mt-4">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Upload Section */}
          <div className="space-y-6">
            <UploadSection onFileUpload={handleFileUpload} />
          </div>

          {/* Previous Projects Section */}
          <div className="space-y-6">
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
              <PreviousProjects
                onSelectProject={handleSelectPreviousProject}
                projects={previousProjects}
                isLoading={isLoadingProjects}
                error={projectsError}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;