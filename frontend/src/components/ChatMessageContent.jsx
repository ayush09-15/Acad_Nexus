import React from "react";

/**
 * Parses inline formatting:
 * - **bold text**
 * - $math/complexity$
 * - `code tokens`
 * - [Document Name, Page X] source references
 */
function parseInline(text) {
  if (!text) return null;

  const pattern = /(\*\*[^*]+\*\*|\$[^$]+\$|`[^`]+`|\[[^\]]+,\s*Page\s*[^\]]+\])/g;
  const elements = [];
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];

    if (token.startsWith("**") && token.endsWith("**")) {
      elements.push(
        <strong key={`b-${keyIndex++}`} className="chat-bold-text">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("$") && token.endsWith("$")) {
      const mathContent = token.slice(1, -1).replace(/\\/g, "");
      elements.push(
        <code key={`m-${keyIndex++}`} className="chat-math-code">
          {mathContent}
        </code>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      elements.push(
        <code key={`c-${keyIndex++}`} className="chat-inline-code">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("[") && token.endsWith("]")) {
      const citationText = token.slice(1, -1).replace(/\.0\b/, "");
      elements.push(
        <span key={`cite-${keyIndex++}`} className="chat-inline-citation">
          {citationText}
        </span>
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex));
  }

  return elements.length > 0 ? elements : text;
}

/**
 * Renders structured markdown responses cleanly with native HTML elements
 * rather than raw markdown symbols like '###' and '*'.
 */
export default function ChatMessageContent({ text }) {
  if (!text) return null;

  const lines = text.split("\n");
  const blocks = [];
  let currentList = null;

  const flushList = () => {
    if (currentList) {
      blocks.push(currentList);
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    // Dividers: --- or ***
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushList();
      blocks.push({ type: "divider" });
      continue;
    }

    // Headings: ### Title or ## Title or # Title
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      continue;
    }

    // Bullet items: * item, - item, + item, • item
    const bulletMatch = trimmed.match(/^[\*\-\+•]\s+(.+)$/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== "bullet-list") {
        flushList();
        currentList = { type: "bullet-list", items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    // Numbered items: 1. item, 2. item
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numMatch) {
      if (!currentList || currentList.type !== "numbered-list") {
        flushList();
        currentList = { type: "numbered-list", items: [] };
      }
      currentList.items.push(numMatch[2]);
      continue;
    }

    // Regular paragraph
    flushList();
    blocks.push({ type: "paragraph", text: trimmed });
  }

  flushList();

  return (
    <div className="chat-formatted-body">
      {blocks.map((block, idx) => {
        if (block.type === "divider") {
          return <hr key={idx} className="chat-body-divider" />;
        }

        if (block.type === "heading") {
          return (
            <h4 key={idx} className="chat-body-heading">
              {parseInline(block.text)}
            </h4>
          );
        }

        if (block.type === "bullet-list") {
          return (
            <ul key={idx} className="chat-bullet-list">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="chat-bullet-item">
                  {parseInline(item)}
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "numbered-list") {
          return (
            <ol key={idx} className="chat-numbered-list">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="chat-numbered-item">
                  {parseInline(item)}
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={idx} className="chat-body-paragraph">
            {parseInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
