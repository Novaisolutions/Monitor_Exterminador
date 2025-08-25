import React from 'react';

interface ImageViewerProps {
  modalImage: string | null;
  currentImageGroup: string[];
  currentImageIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  modalImage,
  currentImageGroup,
  currentImageIndex,
  onClose,
  onPrev,
  onNext,
}) => {
  // Si no hay imagen para mostrar, no renderizar nada
  if (!modalImage) {
    return null;
  }

  return (
    <div
      className="image-modal-overlay"
      onClick={onClose} // Cerrar al hacer clic en el fondo
      role="dialog" // Mejorar accesibilidad
      aria-modal="true"
      aria-labelledby="image-viewer-title"
    >
      <div className="image-modal-container" onClick={(e) => e.stopPropagation()}> {/* Evitar cierre al hacer clic en el contenedor */}
        <img
          id="image-viewer-title" // Para aria-labelledby
          src={modalImage}
          alt={`Imagen ampliada ${currentImageIndex + 1} de ${currentImageGroup.length}`}
          className="image-modal-content"
          style={{ maxWidth: '85vw', maxHeight: '85vh', objectFit: 'contain' }}
        />
        
        {/* Controles de navegación */}
        {currentImageGroup.length > 1 && (
          <div className="image-modal-controls">
            <button 
              className="nav-button prev-button"
              onClick={onPrev}
              aria-label="Imagen anterior"
            >
              ←
            </button>
            
            <div className="image-counter-modal" aria-live="polite"> {/* Anunciar cambios para lectores de pantalla */}
              {currentImageIndex + 1} / {currentImageGroup.length}
            </div>
            
            <button 
              className="nav-button next-button"
              onClick={onNext}
              aria-label="Siguiente imagen"
            >
              →
            </button>
          </div>
        )}

        {/* Botón de cierre explícito (opcional, pero bueno para accesibilidad) */}
        <button 
          className="close-button" 
          onClick={onClose} 
          aria-label="Cerrar visor de imágenes"
          style={closeButtonStyle} // Estilo inline temporal
        >
          &times; {/* Símbolo de cierre */}
        </button>
      </div>
    </div>
  );
};

// Estilo temporal para el botón de cierre (podría ir en CSS)
const closeButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  background: 'rgba(0, 0, 0, 0.6)',
  color: 'white',
  border: 'none',
  borderRadius: '50%',
  width: '30px',
  height: '30px',
  fontSize: '20px',
  lineHeight: '30px',
  textAlign: 'center',
  cursor: 'pointer',
  zIndex: 1002
};

export default ImageViewer; 