import React from 'react';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

interface EmailContentRendererProps {
  content: string;
  className?: string;
}

const EmailContentRenderer: React.FC<EmailContentRendererProps> = ({
  content,
  className
}) => {
  // Sanitize and prepare the HTML content
  const sanitizedContent = React.useMemo(() => {
    // Configure DOMPurify to allow certain tags and attributes
    DOMPurify.setConfig({
      ALLOWED_TAGS: [
        'a', 'b', 'br', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'i', 'img', 'li', 'ol', 'p', 'span', 'strong', 'table', 'tbody',
        'td', 'th', 'thead', 'tr', 'u', 'ul'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'style', 'class', 'target',
        'data-*', 'aria-*'
      ],
      ALLOW_DATA_ATTR: true,
      ADD_ATTR: ['target'], // Allow target="_blank" for links
    });

    // Clean the HTML
    const clean = DOMPurify.sanitize(content, {
      USE_PROFILES: { html: true }
    });

    return clean;
  }, [content]);

  // Process the content to handle special cases
  const processedContent = React.useMemo(() => {
    let processed = sanitizedContent;

    // Convert plain URLs to clickable links
    processed = processed.replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">$1</a>'
    );

    // Handle email addresses
    processed = processed.replace(
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      '<a href="mailto:$1" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">$1</a>'
    );

    return processed;
  }, [sanitizedContent]);

  return (
    <div 
      className={cn(
        "email-content",
        "prose dark:prose-invert max-w-none",
        // Base styles
        "text-base leading-relaxed",
        // Link styles
        "[&_a]:text-blue-600 [&_a]:hover:text-blue-800 dark:[&_a]:text-blue-400 dark:[&_a]:hover:text-blue-300",
        // Image styles
        "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg",
        // Table styles
        "[&_table]:w-full [&_table]:border-collapse [&_table]:my-4",
        "[&_td,&_th]:border [&_td,&_th]:border-gray-300 dark:[&_td,&_th]:border-gray-700 [&_td,&_th]:p-2",
        // Quote styles
        "[&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 dark:[&_blockquote]:border-gray-700 [&_blockquote]:pl-4 [&_blockquote]:italic",
        // List styles
        "[&_ul]:list-disc [&_ol]:list-decimal [&_ul,&_ol]:pl-6",
        className
      )}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
};

export default EmailContentRenderer;
