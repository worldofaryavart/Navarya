import { BookOpen, ChevronDown, ChevronRight, List, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";

interface PDFData {
  name: string;
  size: number;
  type: string;
  fileId: string;
  pdfUrl: string;
  summary: string;
  keyPoints: string[];
  isLoadingSummary: boolean; // Added for loading state
  summaryError: string | null; // Added for error state
}

interface PDFSummaryProps {
  pdfData: PDFData;
}

const PDFSummary: React.FC<PDFSummaryProps> = ({ pdfData }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="bg-purple-500/20 p-2 rounded-lg">
            <Sparkles className="text-purple-400" size={20} />
          </div>
          <h3 className="font-medium text-white">AI Summary</h3>
        </div>
        {isExpanded ? (
          <ChevronDown className="text-gray-400" size={20} />
        ) : (
          <ChevronRight className="text-gray-400" size={20} />
        )}
      </div>
      
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {pdfData.isLoadingSummary ? (
            <div className="bg-gray-900/50 rounded-lg p-4 flex items-center justify-center text-gray-400">
              <Loader2 className="animate-spin mr-2" size={20} />
              Generating AI Summary...
            </div>
          ) : pdfData.summaryError ? (
            <div className="bg-red-900/30 text-red-200 p-4 rounded-lg flex items-center">
              <AlertCircle className="mr-2" size={20} />
              {pdfData.summaryError}
            </div>
          ) : (
            <>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2 flex items-center">
                  <BookOpen size={16} className="mr-2 text-blue-400" />
                  Document Summary
                </h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {pdfData.summary || "No summary available."}
                </p>
              </div>
              
              <div className="bg-gray-900/50 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3 flex items-center">
                  <List size={16} className="mr-2 text-green-400" />
                  Key Points
                </h4>
                <ul className="space-y-2">
                  {pdfData.keyPoints && pdfData.keyPoints.length > 0 ? (
                    pdfData.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-300">{point}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-300 text-sm">No key points available.</li>
                  )}
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PDFSummary;
