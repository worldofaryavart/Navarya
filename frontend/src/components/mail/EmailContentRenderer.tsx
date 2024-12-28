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
  // Extract and process styles from the content
  const processStyles = React.useCallback((htmlContent: string) => {
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    const styles: string[] = [];
    let match;
    let processedContent = htmlContent;

    // Extract all style tags
    while ((match = styleRegex.exec(htmlContent)) !== null) {
      styles.push(match[1]);
      // Remove style tag from content as we'll add it properly later
      processedContent = processedContent.replace(match[0], '');
    }

    return {
      styles: styles.join('\n'),
      content: processedContent
    };
  }, []);

  // Sanitize and prepare the HTML content
  const sanitizedContent = React.useMemo(() => {
    const { styles, content: processedContent } = processStyles(content);

    // Configure DOMPurify to allow more tags and attributes
    DOMPurify.setConfig({
      ALLOWED_TAGS: [
        'a', 'b', 'br', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'i', 'img', 'li', 'ol', 'p', 'span', 'strong', 'table', 'tbody',
        'td', 'th', 'thead', 'tr', 'u', 'ul', 'style', 'link', 'center',
        'section', 'article', 'header', 'footer', 'nav', 'main', 'aside',
        'figure', 'figcaption', 'picture', 'source', 'button', 'meta',
        'html', 'body', 'head', 'title', 'script', 'style', 'link',
        'form', 'input', 'select', 'option', 'label', 'iframe'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'style', 'class', 'target', 'id',
        'width', 'height', 'align', 'valign', 'bgcolor', 'border',
        'cellpadding', 'cellspacing', 'color', 'data-*', 'aria-*',
        'role', 'type', 'xmlns', 'background', 'name', 'content',
        'http-equiv', 'charset', 'property', 'lang', 'xml:lang',
        'frameborder', 'allowfullscreen', 'rel', 'disabled', 'checked',
        'selected', 'value', 'placeholder', 'for', 'media'
      ],
      ALLOW_DATA_ATTR: true,
      ADD_ATTR: ['target'],
      WHOLE_DOCUMENT: true,
      ALLOW_UNKNOWN_PROTOCOLS: true,
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data|blob):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      ADD_TAGS: ['style'],
      KEEP_CONTENT: true,
    });

    // Clean the HTML while preserving structure
    const clean = DOMPurify.sanitize(
      `<div class="email-wrapper">
        <style>${styles}</style>
        ${processedContent}
      </div>`,
      {
        USE_PROFILES: { html: true },
        SANITIZE_DOM: true,
        ALLOW_ARIA_ATTR: true,
      }
    );

    return clean;
  }, [content, processStyles]);

  return (
    <div 
      className={cn(
        "email-content relative",
        // Base container styles
        "w-full max-w-full overflow-x-hidden",
        // Content styles
        "text-base leading-relaxed",
        // Image styles
        "[&_img]:max-w-full [&_img]:h-auto",
        // Table styles
        "[&_table]:w-full [&_table]:border-collapse",
        // Link styles
        "[&_a]:text-blue-600 hover:[&_a]:text-blue-800 dark:[&_a]:text-blue-400 dark:hover:[&_a]:text-blue-300",
        // Fix common email rendering issues
        "[&_*]:max-w-full [&_.email-wrapper]:!w-full",
        // Preserve original email styles while ensuring dark mode compatibility
        "dark:text-gray-100 [&_.email-wrapper]:text-gray-900 dark:[&_.email-wrapper]:text-inherit",
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

export default EmailContentRenderer;
