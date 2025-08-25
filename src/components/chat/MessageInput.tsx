import React from 'react';
import { Send, Grid3X3 } from 'lucide-react';

interface MessageInputProps {
  messageInput: string;
  onMessageInputChange: (value: string) => void;
  onSendMessage: () => void;
  // Podríamos añadir props para manejar archivos adjuntos en el futuro
  // onAttachFile?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  messageInput,
  onMessageInputChange,
  onSendMessage,
}) => {

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { // Enviar con Enter (no con Shift+Enter)
      e.preventDefault(); // Prevenir nueva línea en el input
      onSendMessage();
    }
  };

  return (
    <div className="message-input-container">
      <div className="message-attachment-buttons">
        <button className="attachment-button" /* onClick={onAttachFile} */ title="Adjuntar archivo (Próximamente)">
          <Grid3X3 size={18} /> 
        </button>
        {/* Añadir más botones de adjuntos aquí si es necesario */}
      </div>
      <input
        type="text"
        className="message-input"
        placeholder="Escribe un mensaje..."
        value={messageInput}
        onChange={(e) => onMessageInputChange(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <button
        className="message-send-button"
        onClick={onSendMessage}
        disabled={!messageInput.trim()} // Deshabilitar si está vacío
        title="Enviar mensaje"
      >
        <Send size={18} />
      </button>
    </div>
  );
};

export default MessageInput; 