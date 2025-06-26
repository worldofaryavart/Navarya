// components/PreviousProjects.tsx
import React from 'react';

interface Project {
  id: string;
  name: string;
  uploadDate: string;
  fileId: string; // Add fileId as it's needed to load the document in NewChatPage
  pdfUrl: string; // Add pdfUrl for the same reason
}

interface PreviousProjectsProps {
  onSelectProject: (fileId: string) => void; // Changed to fileId
  projects: Project[];
  isLoading: boolean;
  error: string | null;
}

const PreviousProjects: React.FC<PreviousProjectsProps> = ({ onSelectProject, projects, isLoading, error }) => {
  if (isLoading) {
    return <div className="text-gray-400">Loading previous projects...</div>;
  }

  if (error) {
    return <div className="text-red-400">Error loading projects: {error}</div>;
  }

  if (projects.length === 0) {
    return <div className="text-gray-400">No previous projects found. Upload a document to get started!</div>;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4 text-white">Your Previous Projects</h2>
      <div className="space-y-3">
        {projects.map((project) => (
          <div
            key={project.id} // Use project.id for key
            className="bg-gray-700/30 p-4 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors"
            onClick={() => onSelectProject(project.fileId)} // Pass fileId for selection
          >
            <h3 className="text-lg font-medium text-white">{project.name}</h3>
            <p className="text-gray-400 text-sm">Uploaded on: {new Date(project.uploadDate).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PreviousProjects;