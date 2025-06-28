import React from 'react';
import { FileText, Calendar, ArrowRight, Loader2, AlertCircle, FolderOpen } from 'lucide-react';

interface Project {
  id: string;
  original_name: string;
  uploaded_at: string;
  fileId: string;
  pdfUrl: string;
}

interface PreviousProjectsProps {
  onSelectProject: (fileId: string) => void;
  projects: Project[];
  isLoading: boolean;
  error: string | null;
}

const PreviousProjects: React.FC<PreviousProjectsProps> = ({ 
  onSelectProject, 
  projects, 
  isLoading, 
  error 
}) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="text-indigo-400 animate-spin mx-auto mb-4" size={32} />
          <p className="text-gray-400">Loading your projects...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="text-red-400 mx-auto mb-4" size={32} />
          <p className="text-red-400 font-medium mb-2">Unable to load projects</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/50 rounded-2xl flex items-center justify-center">
          <FolderOpen className="text-gray-400" size={24} />
        </div>
        <h3 className="text-white font-medium mb-2">No projects yet</h3>
        <p className="text-gray-400 text-sm">
          Upload your first document to get started with AI-powered insights!
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const truncateFileName = (name: string, maxLength: number = 30) => {
    if (name.length <= maxLength) return name;
    const extension = name.split('.').pop();
    const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
    const truncated = nameWithoutExt.substring(0, maxLength - extension!.length - 4);
    return `${truncated}...${extension}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Recent Projects</h3>
        <span className="text-sm text-gray-400 bg-gray-700/50 px-3 py-1 rounded-full">
          {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        </span>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto custom-scroll">
        {projects.map((project, index) => (
          <div
            key={project.id}
            className="group bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/30 hover:border-indigo-500/30 p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02]"
            onClick={() => onSelectProject(project.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <div className="bg-indigo-500/20 p-2 rounded-lg flex-shrink-0 group-hover:bg-indigo-500/30 transition-colors">
                  <FileText className="text-indigo-400" size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium group-hover:text-indigo-300 transition-colors truncate">
                    {truncateFileName(project.original_name)}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="text-gray-500" size={12} />
                    <span className="text-gray-400 text-sm">
                      {formatDate(project.uploaded_at)}
                    </span>
                  </div>
                </div>
              </div>
              <ArrowRight 
                className="text-gray-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" 
                size={16} 
              />
            </div>
          </div>
        ))}
      </div>
      
      {projects.length > 5 && (
        <div className="mt-4 text-center">
          <p className="text-gray-500 text-sm">
            Scroll to see more projects
          </p>
        </div>
      )}
    </div>
  );
};

export default PreviousProjects;