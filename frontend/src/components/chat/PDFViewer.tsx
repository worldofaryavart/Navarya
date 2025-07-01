import { Download, Eye, FileText } from "lucide-react";
import { useState } from "react";

interface PDFData {
  name: string;
  size: number;
  type: string;
  fileId: string;
  pdfUrl: string; // Added pdfUrl for displaying the PDF
  summary: string;
  keyPoints: string[];
  isLoadingSummary: boolean;
  summaryError: string | null;
}

const PDFViewer = ({ pdfData }: { pdfData: PDFData }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleDownload = () => {
    if (pdfData.pdfUrl) {
      // Create a temporary anchor element to trigger the download
      const link = document.createElement('a');
      link.href = pdfData.pdfUrl;
      link.download = pdfData.name; // Suggest the original file name for download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="bg-red-500/20 p-2 rounded-lg">
            <FileText className="text-red-400" size={20} />
          </div>
          <div>
            <h3 className="font-medium text-white truncate max-w-[200px]">
              {pdfData.name}
            </h3>
            <p className="text-sm text-gray-400">
              {(pdfData.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Toggle view"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Download"
            disabled={!pdfData.pdfUrl} // Disable if no URL is available
          >
            <Download size={16} />
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-4 bg-gray-900 rounded-lg p-2 max-h-96 overflow-y-auto">
          {pdfData.pdfUrl ? (
            <iframe
              src={pdfData.pdfUrl}
              title={pdfData.name}
              className="w-full h-96 border-none rounded-md"
              style={{ minHeight: '300px' }} // Ensure a minimum height for better viewing
            >
              Your browser does not support iframes. You can <a href={pdfData.pdfUrl} download={pdfData.name}>download the PDF</a> instead.
            </iframe>
          ) : (
            <div className="text-center text-gray-400 p-4">
              PDF preview not available.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
