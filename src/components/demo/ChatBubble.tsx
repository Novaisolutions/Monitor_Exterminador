import React from "react";
import { cn } from "../../lib/utils";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  isLast: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  role,
  content,
  isLast,
}) => {
  const bubbleClasses = cn(
    "relative mb-4 flex max-w-[80%] items-start",
    {
      "self-end": role === "user",
      "self-start": role === "assistant",
    },
    isLast ? "animate-slide-in" : ""
  );

  const contentClasses = cn(
    "rounded-lg px-4 py-2 text-white",
    {
      "bg-blue-600": role === "user",
      "bg-gray-700": role === "assistant",
    }
  );

  const avatar =
    role === "user" ? (
      <div className="flex size-8 shrink-0 select-none items-center justify-center rounded-full bg-blue-600 text-sm font-semibold uppercase text-white">
        U
      </div>
    ) : (
      <div className="flex size-8 shrink-0 select-none items-center justify-center rounded-full bg-black/50 text-white">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="size-5"
        >
          <path
            fillRule="evenodd"
            d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 0 1 .75.75c0 4.68-2.056 9.01-5.625 12.375-3.57 3.366-7.875 5.625-12.375 5.625a.75.75 0 0 1-.75-.75c0-5.056 2.383-9.555 6.085-12.436A.75.75 0 0 1 9.315 7.584Zm1.56 1.405a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 1 1-1.06-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Zm3.182-3.182a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    );

  return (
    <div className={bubbleClasses}>
      {role === "assistant" && <div className="mr-3">{avatar}</div>}
      <div className={contentClasses}>
        <p>{content}</p>
      </div>
      {role === "user" && <div className="ml-3">{avatar}</div>}
    </div>
  );
};

export default ChatBubble; 