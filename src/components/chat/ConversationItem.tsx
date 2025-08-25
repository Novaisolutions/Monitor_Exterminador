import React from 'react';
import { formatDistanceToNow, isToday, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Conversacion, Mensaje } from '../../types/database';
import { getProfileProps } from '../../utils/avatarUtils';
import ProfilePicture from '../ui/ProfilePicture';

interface ConversationItemProps {
  conversation?: Conversacion;
  messagePreview?: Mensaje;
  isSelected: boolean;
  onClick: () => void;
  getConversationFromMessage?: (msg: Mensaje) => Conversacion | null;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ 
  conversation,
  messagePreview,
  isSelected, 
  onClick,
  getConversationFromMessage
}) => {
  const displayConversation = messagePreview && getConversationFromMessage 
                              ? getConversationFromMessage(messagePreview) 
                              : conversation;
  
  if (!displayConversation && !messagePreview) return null;

  const displayName = displayConversation?.nombre_contacto || (messagePreview ? `Mensaje de ${displayConversation?.numero || 'Desconocido'}` : "Sin Nombre");
  const displayTime = messagePreview?.fecha ? new Date(messagePreview.fecha) : (displayConversation?.updated_at ? new Date(displayConversation.updated_at) : new Date());
  const previewText = messagePreview?.mensaje || displayConversation?.ultimo_mensaje_resumen || '...';
  const unreadCount = displayConversation?.no_leidos_count || 0;
  
  const { initials, bgColor } = getProfileProps(displayName);

  let timeString = '';
  try {
    if (isToday(displayTime)) {
      timeString = format(displayTime, 'HH:mm');
    } else {
      timeString = format(displayTime, 'dd/MM/yy');
    }
  } catch (e) {
    console.error("Error formatting date:", displayTime, e);
    timeString = '--:--'; // Fallback
  }

  return (
    <div 
      className={`conversation-item ${isSelected ? 'active' : ''}`} 
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
    >
      <ProfilePicture 
        initials={initials} 
        bgColor={bgColor} 
        size="md"
        className="mr-3"
      />
      <div className="conversation-details">
        <div className="conversation-name-container">
          <span className="conversation-name">{displayName}</span>
          <span className="conversation-time">{timeString}</span>
        </div>
        <div className="conversation-preview-container">
           {messagePreview && !displayConversation?.nombre_contacto && <span className="conversation-number">{displayConversation?.numero}</span>}
          <p className="conversation-preview">{previewText}</p>
          {unreadCount > 0 && !isSelected && (
            <span className="unread-badge" aria-label={`${unreadCount} mensajes no leídos`}>{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem; 