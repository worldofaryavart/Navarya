const renderMessageContent = (message: MessageWithTimestamp) => {
  const parseContent = (content: string) => {
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let currentListItems: string[] = [];
    let currentListType: "ul" | "ol" | null = null;
    let inCodeBlock = false;
    let codeBlockLines: string[] = [];
    let codeBlockLanguage = "";

    const flushCurrentList = () => {
      if (currentListItems.length > 0) {
        const ListComponent = currentListType === "ol" ? "ol" : "ul";
        elements.push(
          <ListComponent
            key={elements.length}
            className={`${
              currentListType === "ol" ? "list-decimal" : "list-disc"
            } list-inside ml-4 space-y-1 my-2`}
          >
            {currentListItems.map((item, idx) => (
              <li
                key={idx}
                className={
                  message.role === "user"
                    ? "text-blue-100 leading-relaxed"
                    : "text-gray-300 leading-relaxed"
                }
              >
                {parseInlineFormatting(item)}
              </li>
            ))}
          </ListComponent>
        );
        currentListItems = [];
        currentListType = null;
      }
    };

    const flushCodeBlock = () => {
      if (codeBlockLines.length > 0) {
        elements.push(
          <div key={elements.length} className="my-3">
            <div
              className={`${
                message.role === "user"
                  ? "bg-blue-800/30 border-blue-600/50"
                  : "bg-gray-900 border-gray-700"
              } rounded-lg border overflow-hidden`}
            >
              {codeBlockLanguage && (
                <div
                  className={`${
                    message.role === "user"
                      ? "bg-blue-700/30 text-blue-200 border-blue-600/50"
                      : "bg-gray-800 text-gray-400 border-gray-700"
                  } px-3 py-1 text-xs border-b`}
                >
                  {codeBlockLanguage}
                </div>
              )}
              <pre className="p-3 overflow-x-auto">
                <code
                  className={`${
                    message.role === "user" ? "text-blue-100" : "text-gray-300"
                  } text-sm font-mono`}
                >
                  {codeBlockLines.join("\n")}
                </code>
              </pre>
            </div>
          </div>
        );
        codeBlockLines = [];
        codeBlockLanguage = "";
      }
    };

    lines.forEach((line, index) => {
      if (line.startsWith("```")) {
        if (inCodeBlock) {
          inCodeBlock = false;
          flushCodeBlock();
        } else {
          flushCurrentList();
          inCodeBlock = true;
          codeBlockLanguage = line.substring(3).trim();
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockLines.push(line);
        return;
      }

      if (line.startsWith("###")) {
        flushCurrentList();
        elements.push(
          <h3
            key={elements.length}
            className={`text-lg font-semibold ${
              message.role === "user" ? "text-blue-50" : "text-white"
            } mt-4 mb-2`}
          >
            {parseInlineFormatting(line.substring(3).trim())}
          </h3>
        );
        return;
      }

      if (line.startsWith("##")) {
        flushCurrentList();
        elements.push(
          <h2
            key={elements.length}
            className={`text-xl font-semibold ${
              message.role === "user" ? "text-blue-50" : "text-white"
            } mt-4 mb-2`}
          >
            {parseInlineFormatting(line.substring(2).trim())}
          </h2>
        );
        return;
      }

      if (line.startsWith("#")) {
        flushCurrentList();
        elements.push(
          <h1
            key={elements.length}
            className={`text-2xl font-bold ${
              message.role === "user" ? "text-blue-50" : "text-white"
            } mt-4 mb-3`}
          >
            {parseInlineFormatting(line.substring(1).trim())}
          </h1>
        );
        return;
      }

      const numberedListMatch = line.match(/^\d+\.\s+(.+)$/);
      if (numberedListMatch) {
        if (currentListType !== "ol") {
          flushCurrentList();
          currentListType = "ol";
        }
        currentListItems.push(numberedListMatch[1]);
        return;
      }

      const bulletListMatch = line.match(/^[-•*]\s+(.+)$/);
      if (bulletListMatch) {
        if (currentListType !== "ul") {
          flushCurrentList();
          currentListType = "ul";
        }
        currentListItems.push(bulletListMatch[1]);
        return;
      }

      if (line.startsWith(">")) {
        flushCurrentList();
        elements.push(
          <blockquote
            key={elements.length}
            className={`border-l-4 ${
              message.role === "user"
                ? "border-blue-300 text-blue-100"
                : "border-blue-500 text-gray-300"
            } pl-4 my-3 italic`}
          >
            {parseInlineFormatting(line.substring(1).trim())}
          </blockquote>
        );
        return;
      }

      if (line.trim() === "---" || line.trim() === "***") {
        flushCurrentList();
        elements.push(
          <hr
            key={elements.length}
            className={`my-4 ${
              message.role === "user" ? "border-blue-300/50" : "border-gray-600"
            }`}
          />
        );
        return;
      }

      if (line.trim() === "") {
        flushCurrentList();
        if (elements.length > 0) {
          elements.push(<br key={elements.length} />);
        }
        return;
      }

      flushCurrentList();
      elements.push(
        <p
          key={elements.length}
          className={`${
            message.role === "user" ? "text-blue-50" : "text-gray-300"
          } leading-relaxed my-2`}
        >
          {parseInlineFormatting(line)}
        </p>
      );
    });

    flushCurrentList();
    flushCodeBlock();

    return elements;
  };

  const parseInlineFormatting = (text: string): React.ReactNode => {
    const userStyles = message.role === "user";

    text = text.replace(
      /`([^`]+)`/g,
      `<code class="${
        userStyles
          ? "bg-blue-700/30 text-blue-100"
          : "bg-gray-800 text-gray-300"
      } px-1 py-0.5 rounded text-sm font-mono">$1</code>`
    );
    text = text.replace(
      /\*\*([^*]+)\*\*/g,
      `<strong class="font-semibold ${
        userStyles ? "text-blue-50" : "text-white"
      }">$1</strong>`
    );
    text = text.replace(
      /__([^_]+)__/g,
      `<strong class="font-semibold ${
        userStyles ? "text-blue-50" : "text-white"
      }">$1</strong>`
    );
    text = text.replace(
      /\*([^*]+)\*/g,
      `<em class="italic ${
        userStyles ? "text-blue-100" : "text-gray-200"
      }">$1</em>`
    );
    text = text.replace(
      /_([^_]+)_/g,
      `<em class="italic ${
        userStyles ? "text-blue-100" : "text-gray-200"
      }">$1</em>`
    );
    text = text.replace(
      /~~([^~]+)~~/g,
      `<del class="line-through ${
        userStyles ? "text-blue-200" : "text-gray-400"
      }">$1</del>`
    );
    text = text.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      `<a href="$2" class="${
        userStyles
          ? "text-blue-200 hover:text-blue-100"
          : "text-blue-400 hover:text-blue-300"
      } underline" target="_blank" rel="noopener noreferrer">$1</a>`
    );
    text = text.replace(
      /\[Reference\s+(\d+),?\s*([^\]]+)\]/g,
      `<span class="${
        userStyles
          ? "bg-blue-800/40 text-blue-200 border-blue-600/50"
          : "bg-blue-900/30 text-blue-300 border-blue-700/50"
      } px-2 py-0.5 rounded-md text-sm border">[Ref $1, $2]</span>`
    );
    text = text.replace(
      /==([^=]+)==/g,
      `<mark class="${
        userStyles
          ? "bg-yellow-500/30 text-yellow-100"
          : "bg-yellow-600/30 text-yellow-200"
      } px-1 rounded">$1</mark>`
    );

    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  };

  if (message.role === "user") {
    return (
      <div className="text-white whitespace-pre-wrap break-words">
        {parseContent(message.content)}
      </div>
    );
  }

  return (
    <div className="text-gray-300 leading-relaxed break-words">
      {parseContent(message.content)}
    </div>
  );
};

export default renderMessageContent;
