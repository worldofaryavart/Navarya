import React, { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Mic, Loader2 } from "lucide-react";

const AIControlButton: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close the interface
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleSpeechRecognition = () => {
    if ("webkitSpeechRecognition" in window) {
      setIsListening(true);
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert("Speech recognition not supported in this browser");
    }
  };

  const handleSubmit = async () => {
    console.log("inpput values is : ", inputValue);
    if (!inputValue.trim()) return;
    console.log("input valu: ", inputValue);

    setIsProcessing(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: inputValue }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.response) {
        throw new Error("No response content in API response");
      }

      console.log("data response is : ", data.response);

      // Reset after processing
      setInputValue("");
      setIsProcessing(false);
    } catch (error) {
      console.error("Processing error", error);
      setIsProcessing(false);
    }
  };

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50">
      {/* Floating AI Control Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-16 h-16 rounded-full shadow-2xl transition-all duration-300 
          ${
            isExpanded
              ? "bg-purple-600 rotate-45"
              : "bg-purple-500 hover:bg-purple-600"
          } 
          text-white flex items-center justify-center
        `}
      >
        {isExpanded ? <X size={24} /> : <Sparkles size={24} />}
      </button>

      {/* Expanded AI Control Interface */}
      {isExpanded && (
        <div
          className="
            absolute bottom-20 right-0 w-96 
            bg-gray-800 rounded-2xl shadow-2xl 
            border border-gray-700 
            transition-all duration-300
          "
        >
          <div className="p-4 space-y-4">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me anything, control your app..."
              className="
                w-full bg-gray-700 text-white 
                rounded-xl p-3 min-h-[50px] max-h-[200px] 
                resize-none overflow-auto
                focus:outline-none focus:ring-2 focus:ring-purple-500
              "
              rows={1}
            />

            <div className="flex space-x-2">
              <button
                onClick={handleSpeechRecognition}
                disabled={isListening}
                className={`
                  p-2 rounded-full 
                  ${
                    isListening
                      ? "bg-red-500 text-white"
                      : "bg-gray-700 hover:bg-gray-600"
                  }
                  transition-colors
                `}
              >
                <Mic size={20} />
              </button>

              <button
                onClick={handleSubmit}
                disabled={!inputValue.trim() || isProcessing}
                className={`
                  flex-grow py-2 px-4 rounded-xl 
                  ${
                    inputValue.trim() && !isProcessing
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-gray-700 text-gray-500"
                  }
                  flex items-center justify-center
                  transition-colors
                `}
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIControlButton;
