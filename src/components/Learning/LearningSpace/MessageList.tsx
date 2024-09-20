import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FaUser, FaRobot } from 'react-icons/fa';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  structuredContent?: {
    mainPoints: string[];
    followUpQuestion?: string;
  };
  codeBlock?: string;
  imageUrl?: string;
  audioUrl?: string;
}

interface MessageListProps {
  messages: Message[];
  copyToClipboard: (content: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, copyToClipboard }) => {
  const renderMessageContent = (msg: Message) => {
    return (
      <ReactMarkdown
        components={{
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {msg.content}
      </ReactMarkdown>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`flex ${
            msg.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-3/4 p-3 rounded-lg ${
              msg.role === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            <div className="flex items-center mb-2">
              {msg.role === 'user' ? (
                <FaUser className="mr-2" />
              ) : (
                <FaRobot className="mr-2" />
              )}
              <span className="font-bold">
                {msg.role === 'user' ? 'You' : 'AI'}
              </span>
            </div>
            {renderMessageContent(msg)}
            {msg.structuredContent && (
              <div className="mt-2">
                <h4 className="font-bold">Main Points:</h4>
                <ul className="list-disc list-inside">
                  {msg.structuredContent.mainPoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
                {msg.structuredContent.followUpQuestion && (
                  <p className="mt-2">
                    <strong>Follow-up Question:</strong>{' '}
                    {msg.structuredContent.followUpQuestion}
                  </p>
                )}
              </div>
            )}
            {msg.codeBlock && (
              <div className="mt-2">
                <h4 className="font-bold">Code:</h4>
                <SyntaxHighlighter language="javascript" style={vscDarkPlus}>
                  {msg.codeBlock}
                </SyntaxHighlighter>
              </div>
            )}
            {msg.imageUrl && (
              <img
                src={msg.imageUrl}
                alt="Generated image"
                className="mt-2 max-w-full h-auto rounded"
              />
            )}
            {msg.audioUrl && (
              <audio controls className="mt-2 w-full">
                <source src={msg.audioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            )}
            <button
              onClick={() => copyToClipboard(msg.content)}
              className="mt-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Copy
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;