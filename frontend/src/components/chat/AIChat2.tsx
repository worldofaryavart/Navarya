import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Loader2, Send, Mic, HelpCircle, CheckCircle, AlertCircle, Trophy, Target } from "lucide-react";
import { auth } from "@/utils/config/firebase.config";
import { getApiUrl } from "@/utils/config/api.config";

interface PDFData {
  name: string;
  size: number;
  type: string;
  url?: string;
  summary: string;
  keyPoints: string[];
  fileId: string;
}

interface Question {
  id: string;
  question: string;
  expected_answer: string;
  difficulty: string;
  source_chunk: any;
  reference_section: string;
}

interface Evaluation {
  score: number;
  is_correct: boolean;
  feedback: string;
  missing_points: string[];
  strengths: string[];
  reference_text: string;
}

interface AIChat2Props {
  pdfData: PDFData;
}

interface MessageWithTimestamp {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: Array<{
    document: string;
    section: string;
    page?: number;
    confidence: number;
  }>;
  confidence?: number;
  showQuestionButtons?: boolean;
}

interface QuestionSession {
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: string[];
  evaluations: Evaluation[];
  isActive: boolean;
  difficulty: string;
}

const AIChat: React.FC<AIChat2Props> = ({ pdfData }) => {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<MessageWithTimestamp[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [questionSession, setQuestionSession] = useState<QuestionSession | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getAuthToken = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");
    const token = await user.getIdToken();
    return token;
  };

  const generateQuestions = async (difficulty: string = "medium") => {
    setIsGeneratingQuestions(true);
    try {
      const userToken = await getAuthToken();
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          document_id: pdfData.fileId,
          difficulty_level: difficulty,
        }),
      });
      const result = await response.json();
      
      if (result.questions && result.questions.length > 0) {
        setQuestionSession({
          questions: result.questions,
          currentQuestionIndex: 0,
          userAnswers: [],
          evaluations: [],
          isActive: true,
          difficulty: difficulty,
        });

        const questionMessage: MessageWithTimestamp = {
          role: "assistant",
          content: `I've generated ${result.questions.length} ${difficulty} difficulty questions based on your document. Let's start with the first one:\n\n**Question 1:**\n${result.questions[0].question}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, questionMessage]);
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      const errorMessage: MessageWithTimestamp = {
        role: "assistant",
        content: "I encountered an error while generating questions. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const evaluateAnswer = async (questionId: string, userAnswer: string) => {
    setIsEvaluating(true);
    try {
      const userToken = await getAuthToken();
      const response = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          question_id: questionId,
          user_answer: userAnswer,
          document_id: pdfData.fileId,
        }),
      });
      const evaluationResult = await response.json();
      return evaluationResult;
    } catch (error) {
      console.error("Error evaluating answer:", error);
      throw error;
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!currentAnswer.trim() || !questionSession || isEvaluating) return;

    const currentQuestion = questionSession.questions[questionSession.currentQuestionIndex];
    
    // Add user's answer to messages
    const userMessage: MessageWithTimestamp = {
      role: "user",
      content: currentAnswer,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const evaluationResult = await evaluateAnswer(currentQuestion.id, currentAnswer);
      
      // Create evaluation message
      const evaluationContent = `**Evaluation Results:**\n\n` +
        `**Score:** ${evaluationResult.score}/100 ${evaluationResult.is_correct ? '✅' : '❌'}\n\n` +
        `**Feedback:** ${evaluationResult.feedback}\n\n` +
        (evaluationResult.strengths?.length > 0 ? `**Strengths:**\n${evaluationResult.strengths.map((strength: string) => `• ${strength}`).join('\n')}\n\n` : '') +
        (evaluationResult.missing_points?.length > 0 ? `**Areas for Improvement:**\n${evaluationResult.missing_points.map((point: string) => `• ${point}`).join('\n')}\n\n` : '') +
        (evaluationResult.reference_text ? `**Reference:** ${evaluationResult.reference_text}` : '');

      const evaluationMessage: MessageWithTimestamp = {
        role: "assistant",
        content: evaluationContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, evaluationMessage]);

      // Update question session
      const updatedSession = {
        ...questionSession,
        userAnswers: [...questionSession.userAnswers, currentAnswer],
        evaluations: [...questionSession.evaluations, evaluationResult],
      };

      // Check if there are more questions
      if (questionSession.currentQuestionIndex < questionSession.questions.length - 1) {
        const nextIndex = questionSession.currentQuestionIndex + 1;
        updatedSession.currentQuestionIndex = nextIndex;
        
        const nextQuestionMessage: MessageWithTimestamp = {
          role: "assistant",
          content: `**Question ${nextIndex + 1}:**\n${questionSession.questions[nextIndex].question}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, nextQuestionMessage]);
      } else {
        // End of questions - show summary
        updatedSession.isActive = false;
        const totalScore = updatedSession.evaluations.reduce((sum, evalItem) => sum + evalItem.score, 0);
        const averageScore = totalScore / updatedSession.evaluations.length;
        const correctAnswers = updatedSession.evaluations.filter(evalItem => evalItem.is_correct).length;

        const summaryMessage: MessageWithTimestamp = {
          role: "assistant",
          content: `🎉 **Quiz Complete!**\n\n` +
            `**Final Results:**\n` +
            `• Questions Answered: ${updatedSession.evaluations.length}\n` +
            `• Correct Answers: ${correctAnswers}/${updatedSession.evaluations.length}\n` +
            `• Average Score: ${averageScore.toFixed(1)}/100\n` +
            `• Difficulty Level: ${updatedSession.difficulty}\n\n` +
            `Great job! You can generate more questions or continue chatting about the document.`,
          timestamp: new Date(),
          showQuestionButtons: true,
        };
        setMessages(prev => [...prev, summaryMessage]);
      }

      setQuestionSession(updatedSession);
      setCurrentAnswer("");
    } catch (error) {
      const errorMessage: MessageWithTimestamp = {
        role: "assistant",
        content: "I encountered an error while evaluating your answer. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleSubmit = async () => {
    if (!inputValue.trim() || isProcessing) return;

    // If in question mode, handle as answer
    if (questionSession?.isActive) {
      setCurrentAnswer(inputValue);
      setInputValue("");
      await handleAnswerSubmit();
      return;
    }

    const userMessage: MessageWithTimestamp = {
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsProcessing(true);

    try {
      const userToken = await getAuthToken();
      const response = await fetch(getApiUrl("/api/process-command"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          role: "user",
          document_id: pdfData.fileId,
          content: inputValue,
          conversation_history: messages,
        }),
      });

      const result = await response.json();

      const assistantMessage: MessageWithTimestamp = {
        role: "assistant",
        content: result.message,
        timestamp: new Date(),
        sources: result.sources,
        confidence: result.confidence,
        showQuestionButtons: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: MessageWithTimestamp = {
        role: "assistant",
        content: "Sorry, I encountered an error processing your request.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSpeechRecognition = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    setIsListening(true);
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (questionSession?.isActive) {
        setCurrentAnswer(transcript);
      } else {
        setInputValue(transcript);
      }
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const renderMessageContent = (message: MessageWithTimestamp) => {
    if (message.role === "user") {
      return (
        <p className="text-white whitespace-pre-wrap break-words">
          {message.content}
        </p>
      );
    }

    return (
      <div className="text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
        {message.content}
      </div>
    );
  };

  const renderQuestionButtons = () => (
    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-700/30">
      <button
        onClick={() => generateQuestions("easy")}
        disabled={isGeneratingQuestions || questionSession?.isActive}
        className="group flex items-center gap-2 px-4 py-2 bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 hover:text-white rounded-lg border border-gray-600/30 hover:border-gray-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        <Target size={16} className="text-green-400 group-hover:text-green-300" />
        Easy Quiz
      </button>
      
      <button
        onClick={() => generateQuestions("medium")}
        disabled={isGeneratingQuestions || questionSession?.isActive}
        className="group flex items-center gap-2 px-4 py-2 bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 hover:text-white rounded-lg border border-gray-600/30 hover:border-gray-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        <HelpCircle size={16} className="text-blue-400 group-hover:text-blue-300" />
        Medium Quiz
      </button>
      
      <button
        onClick={() => generateQuestions("hard")}
        disabled={isGeneratingQuestions || questionSession?.isActive}
        className="group flex items-center gap-2 px-4 py-2 bg-gray-800/60 hover:bg-gray-700/60 text-gray-300 hover:text-white rounded-lg border border-gray-600/30 hover:border-gray-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        <Trophy size={16} className="text-orange-400 group-hover:text-orange-300" />
        Hard Quiz
      </button>
      
      {isGeneratingQuestions && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Generating questions...
        </div>
      )}
    </div>
  );

  const getInputPlaceholder = () => {
    if (questionSession?.isActive) {
      return "Type your answer here...";
    }
    return "Ask about your document...";
  };

  const getSubmitButtonColor = () => {
    if (questionSession?.isActive) {
      return "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700";
    }
    return "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700";
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Messages Container */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="bg-gray-800/30 p-8 rounded-2xl shadow-lg max-w-md mx-auto">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center">
                    <MessageSquare className="text-white" size={24} />
                  </div>
                  <h2 className="text-2xl font-semibold mb-3 text-white">
                    Ready to Chat!
                  </h2>
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    Ask me anything about your document &quot;{pdfData.name}
                    &quot;. I&apos;m here to help you understand the content
                    better.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex message-item ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] lg:max-w-[65%] p-4 rounded-2xl shadow-lg ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-br-md"
                          : "bg-gray-800/80 text-gray-100 rounded-bl-md border border-gray-700/50"
                      }`}
                    >
                      {renderMessageContent(message)}
                      
                      {/* Question Buttons - only show for assistant messages when specified */}
                      {message.role === "assistant" && message.showQuestionButtons && !questionSession?.isActive && renderQuestionButtons()}
                      
                      <div className="mt-2 flex items-center justify-end">
                        <span
                          className={`text-xs ${
                            message.role === "user"
                              ? "text-blue-100/70"
                              : "text-gray-400/70"
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
                {(isProcessing || isEvaluating) && (
                  <div className="flex justify-start">
                    <div className="max-w-[75%] lg:max-w-[65%] p-4 rounded-2xl rounded-bl-md shadow-lg bg-gray-800/80 border border-gray-700/50">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div
                            className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-400">
                          {isEvaluating ? "Evaluating your answer..." : "AI is thinking..."}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-gray-900 border-t border-gray-700/50 p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          {/* Question Session Status */}
          {questionSession?.isActive && (
            <div className="mb-3 p-3 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-lg border border-blue-700/30">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-blue-400" />
                  <span className="text-blue-200">
                    Question {questionSession.currentQuestionIndex + 1} of {questionSession.questions.length}
                  </span>
                  <span className="px-2 py-1 bg-blue-700/30 text-blue-200 rounded text-xs capitalize">
                    {questionSession.difficulty}
                  </span>
                </div>
                <button
                  onClick={() => setQuestionSession(null)}
                  className="text-gray-400 hover:text-gray-300 text-xs"
                >
                  Exit Quiz
                </button>
              </div>
            </div>
          )}
          
          <div className="relative flex items-end bg-gray-800 rounded-2xl border border-gray-700/50 shadow-lg">
            <textarea
              value={questionSession?.isActive ? currentAnswer : inputValue}
              onChange={(e) => {
                if (questionSession?.isActive) {
                  setCurrentAnswer(e.target.value);
                } else {
                  setInputValue(e.target.value);
                }
                e.target.style.height = "inherit";
                e.target.style.height = `${Math.min(
                  e.target.scrollHeight,
                  120
                )}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (questionSession?.isActive) {
                    handleAnswerSubmit();
                  } else {
                    handleSubmit();
                  }
                  e.currentTarget.style.height = "inherit";
                }
              }}
              placeholder={getInputPlaceholder()}
              className="flex-1 bg-transparent text-white py-3 px-4 focus:outline-none resize-none overflow-y-auto min-h-[48px] max-h-[120px] placeholder-gray-400"
              rows={1}
              disabled={isProcessing || isEvaluating}
            />

            <div className="flex items-center pr-2">
              {(questionSession?.isActive ? currentAnswer.trim() : inputValue.trim()) ? (
                <button
                  title={questionSession?.isActive ? "Submit Answer" : "Send Message"}
                  onClick={questionSession?.isActive ? handleAnswerSubmit : handleSubmit}
                  disabled={(questionSession?.isActive ? !currentAnswer.trim() : !inputValue.trim()) || isProcessing || isEvaluating || isListening}
                  className={`p-2.5 ${getSubmitButtonColor()} text-white rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
                  type="button"
                >
                  {(isProcessing || isEvaluating) && !isListening ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              ) : (
                <button
                  title="Use Microphone"
                  onClick={handleSpeechRecognition}
                  disabled={isProcessing || isEvaluating || isListening}
                  className={`p-2.5 rounded-full transition-all duration-200 ${
                    isListening
                      ? "bg-red-600 text-white animate-pulse"
                      : "text-gray-400 hover:text-gray-300 hover:bg-gray-700"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  type="button"
                >
                  <Mic size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;