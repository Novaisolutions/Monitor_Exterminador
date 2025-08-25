import { useState, useEffect, useRef } from 'react';

function useImageViewer() {
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [currentImageGroup, setCurrentImageGroup] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null); // Para el hover

  // Efecto para navegación con teclado y manejo de scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!modalImage) return;
      
      if (e.key === 'Escape') {
        setModalImage(null);
      } else if (e.key === 'ArrowLeft' && currentImageGroup.length > 1) {
        const newIndex = (currentImageIndex - 1 + currentImageGroup.length) % currentImageGroup.length;
        setCurrentImageIndex(newIndex);
        setModalImage(currentImageGroup[newIndex]);
      } else if (e.key === 'ArrowRight' && currentImageGroup.length > 1) {
        const newIndex = (currentImageIndex + 1) % currentImageGroup.length;
        setCurrentImageIndex(newIndex);
        setModalImage(currentImageGroup[newIndex]);
      }
    };

    // Prevenir scroll mientras el modal está abierto
    const handleScroll = (e: Event) => {
      if (modalImage) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleScroll, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleScroll);
    };
  }, [modalImage, currentImageGroup, currentImageIndex]);

  // Función para abrir el modal (usada por los handlers de click/hover)
  const openImageViewer = (url: string, group: string[], index: number) => {
    setModalImage(url);
    setCurrentImageGroup(group);
    setCurrentImageIndex(index);
  };

  // Función para cerrar el modal
  const closeImageViewer = () => {
    setModalImage(null);
  };

  return {
    modalImage,
    currentImageGroup,
    currentImageIndex,
    openImageViewer, 
    closeImageViewer,
    hoverTimerRef, // Exportar la ref para usarla externamente si es necesario
    setCurrentImageIndex, // Puede ser útil si se necesita control externo
    setModalImage // Puede ser útil si se necesita control externo
  };
}

export default useImageViewer; 