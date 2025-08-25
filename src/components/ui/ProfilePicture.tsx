import React from 'react';

interface ProfilePictureProps {
  initials: string;
  bgColor: string;
  size?: 'sm' | 'md' | 'lg'; // Tamaños predefinidos
  className?: string; // Para clases adicionales si es necesario
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({
  initials,
  bgColor,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',    // 32px
    md: 'w-10 h-10 text-sm',   // 40px - Ajustado para `ConversationItem` y `ChatView`
    lg: 'w-12 h-12 text-base', // 48px
  };

  return (
    <div
      className={`flex-shrink-0 flex items-center justify-center rounded-full font-semibold text-white ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: bgColor }}
      aria-label={`Avatar con iniciales ${initials}`}
    >
      {initials}
    </div>
  );
};

export default ProfilePicture; 