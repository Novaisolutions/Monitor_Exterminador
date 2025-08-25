import React from 'react';
import { Bot } from 'lucide-react';

interface TypingIndicatorProps {
  type: 'in' | 'out';
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ type }) => {
  const alignmentClass = type === 'in' ? 'message-inbound' : 'message-outbound';
  
  return (
    <div className={`message-bubble typing-indicator ${alignmentClass}`}>
      <div className="message-content">
        {type === 'out' && (
          <Bot size={16} className="typing-bot-icon" />
        )}
        <div className="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator; 