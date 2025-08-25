import React, { useState, useEffect, useRef } from 'react';
import { User, Bot, GraduationCap, Building, Clock, FileText, Briefcase, Tag, Sparkles, Phone, Calendar, Zap, Target, TrendingUp, MessageCircle } from 'lucide-react';
import { ProspectoMkt } from '../../types/database';

// --- Componentes de UI Replicados/Simplificados ---

const NeumorphicCard: React.FC<{ children: React.ReactNode; className?: string; }> = ({ children, className }) => (
  <div className={`bg-gray-50 dark:bg-gray-800/50 p-4 sm:p-5 rounded-2xl shadow-lg dark:shadow-2xl dark:shadow-black/20 border border-gray-200 dark:border-gray-700/50 transition-all duration-300 ease-in-out ${className || ''}`}>
    {children}
  </div>
);

const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value?: string | number | null; isHighlighted?: boolean; children?: React.ReactNode; }> = ({ icon, label, value, isHighlighted, children }) => (
  <div className={`flex items-start gap-4 text-sm p-2.5 rounded-lg transition-all duration-500 ${isHighlighted ? 'highlight-flash' : ''}`}>
    <span className="text-blue-500 dark:text-blue-400 mt-1">{icon}</span>
    <div className="flex-1">
      <p className="font-semibold text-gray-500 dark:text-gray-400">{label}</p>
      {value ? <p className="text-gray-800 dark:text-gray-200 font-medium">{value}</p> : children}
    </div>
  </div>
);

const ChatBubble: React.FC<{ author: 'user' | 'bot'; text: string; isNew?: boolean; showCaptured?: boolean; }> = ({ author, text, isNew = false, showCaptured = false }) => {
  const isBot = author === 'bot';
  
  // Soporte básico para **negrita**
  const formatText = (txt: string) => {
    return txt.split(/(\*[^*]+\*)/g).map((part, i) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return <strong key={i}>{part.slice(1, -1)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className={`flex flex-col gap-2 mb-4 ${isBot ? 'items-end' : 'items-start'} ${isNew ? 'animate-slide-in' : ''}`}>
      <div className={`flex items-end gap-3 ${isBot ? 'justify-end' : 'justify-start'}`}>
        {!isBot && (
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
        )}
        <div className={`max-w-sm px-4 py-2.5 rounded-2xl ${
          isBot 
            ? 'bg-blue-600 text-white shadow-sm rounded-br-sm' 
            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm rounded-bl-sm border border-gray-200 dark:border-gray-600'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{formatText(text)}</p>
        </div>
        {isBot && (
          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
            <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center overflow-hidden">
              <img 
                src="/bot-logo.png" 
                alt="Bot" 
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V7H1V9H3V15H1V17H3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V17H23V15H21V9H23ZM19 21H5V3H15V9H19V21Z"/></svg>';
                }}
              />
            </div>
          </div>
        )}
      </div>
      {showCaptured && !isBot && (
        <div className="text-xs text-gray-500 dark:text-gray-400 font-normal opacity-60 ml-11">
          ✓ capturado en crm
        </div>
      )}
    </div>
  );
};

// --- Vista Principal de la Demo ---

type ScriptItem = {
    author: 'user' | 'bot';
    text: string;
    delay: number;
    showCaptured?: boolean;
    action?: () => void;
};

const DemoView: React.FC = () => {
    // --- Estado ---
    const [messages, setMessages] = useState<{ author: 'user' | 'bot'; text: string; id: number; showCaptured?: boolean; }[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [prospecto, setProspecto] = useState<Partial<ProspectoMkt>>({
      nombre: 'Esperando contacto...',
      numero_telefono: null,
      carrera_interes: '...',
      plantel_interes: '...',
      estado_embudo: 'Sin contacto',
      probabilidad_conversion: 0,
      score_interes: 0,
      resumen_ia: 'Esperando que llegue el primer mensaje del prospecto...',
      notas_manuales: null,
      notas_ia: 'Sistema de IA iniciado. Esperando interacción del prospecto...'
    });
    const [highlightedField, setHighlightedField] = useState<keyof ProspectoMkt | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isSimulationRunning, setIsSimulationRunning] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const prospectoCardRef = useRef<HTMLDivElement>(null);
    const messageIdRef = useRef(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const isHighlighted = (field: keyof ProspectoMkt) => highlightedField === field;

    // --- Guion de la Simulación (Mejorado) ---
    const script: readonly ScriptItem[] = [
        { 
            author: 'user', 
            text: '¡Hola! Quiero más información sobre las carreras 😊', 
            delay: 1000,
            showCaptured: true,
            action: () => {
                setProspecto(p => ({ 
                    ...p, 
                    nombre: 'Ulises🤠🤓',
                    numero_telefono: '+52 664 123 4567',
                    estado_embudo: 'Contactado',
                    probabilidad_conversion: 20,
                    score_interes: 30,
                    resumen_ia: 'Nuevo prospecto ha iniciado conversación solicitando información general.',
                    notas_ia: 'Primer contacto detectado. Prospecto muestra interés inicial en información educativa. Tono positivo identificado.',
                    notas_manuales: [{ content: 'Primer contacto - Muestra interés inicial', timestamp: new Date().toISOString(), author: 'Sistema' }]
                }));
                setHighlightedField('nombre');
            }
        },
        { 
            author: 'bot', 
            text: '¡Hola! 👋 Soy *Samanta*, tu asesora de INSTITUTO EDUCATIVO BAJA CALIFORNIA.\n\n¿Qué carrera te inspira a construir tu futuro? 🚀', 
            delay: 2000,
            action: () => {
                setProspecto(p => ({ 
                    ...p, 
                    estado_embudo: 'Información Solicitada',
                    resumen_ia: 'Samanta se ha presentado y está recopilando información sobre la carrera de interés.',
                    notas_ia: 'Bot iniciando proceso de cualificación. Pregunta directa sobre carrera de interés para segmentar lead.',
                    notas_manuales: [{ content: 'Bot iniciando proceso de cualificación', timestamp: new Date().toISOString(), author: 'Sistema' }]
                }));
                setHighlightedField('estado_embudo');
            }
        },
        { 
            author: 'user', 
            text: 'Me interesa mucho la ingeniería industrial! 🔧 He estado investigando y me parece súper interesante el tema de optimización de procesos', 
            delay: 1500,
            showCaptured: true,
            action: () => {
                setProspecto(p => ({ 
                    ...p, 
                    carrera_interes: 'Ingeniería Industrial',
                    probabilidad_conversion: 45,
                    score_interes: 60,
                    resumen_ia: 'Prospecto interesado en Ingeniería Industrial. Muestra conocimiento previo sobre optimización de procesos.',
                    notas_ia: 'ALTA CALIFICACIÓN: Prospecto demuestra investigación previa. Conocimiento específico sobre optimización de procesos indica interés genuino. Incrementar prioridad.',
                    notas_manuales: [{ content: 'Demuestra investigación previa - Buen prospecto', timestamp: new Date().toISOString(), author: 'Sistema' }]
                }));
                setHighlightedField('carrera_interes');
            }
        },
        { 
            author: 'bot', 
            text: '¡*Ingeniería Industrial*, excelente elección! ⚙️\n\nNuestros egresados lideran procesos en las mejores empresas.\n\nEsta carrera está disponible en:\n• *Casa Blanca* • *Otay* • *Tecate* • *Palmas*\n\n¿En cuál plantel te gustaría estudiar? 🎯', 
            delay: 2500,
            action: () => {
                setProspecto(p => ({ 
                    ...p, 
                    estado_embudo: 'Información Brindada',
                    probabilidad_conversion: 55,
                    resumen_ia: 'Se ha proporcionado información sobre Ingeniería Industrial y planteles disponibles.',
                    notas_ia: 'Información de planteles proporcionada. Prospecto debe seleccionar ubicación para continuar proceso. Momento crítico de decisión.',
                    notas_manuales: [{ content: 'Información de planteles proporcionada', timestamp: new Date().toISOString(), author: 'Sistema' }]
                }));
                setHighlightedField('estado_embudo');
            }
        },
        { 
            author: 'user', 
            text: 'Casa Blanca me queda perfecto! 🏠 Me queda cerca de mi trabajo y he escuchado muy buenas referencias del plantel', 
            delay: 1200,
            showCaptured: true,
            action: () => {
                setProspecto(p => ({ 
                    ...p, 
                    plantel_interes: 'Casa Blanca',
                    probabilidad_conversion: 65,
                    score_interes: 75,
                    resumen_ia: 'Prospecto ha seleccionado Casa Blanca. Menciona proximidad laboral y referencias positivas.',
                    notas_ia: 'EXCELENTE SEÑAL: Menciona proximidad laboral (estabilidad) y referencias positivas (confianza). Prospecto altamente calificado. Acelerar proceso.',
                    notas_manuales: [{ content: 'Plantel seleccionado por conveniencia y referencias', timestamp: new Date().toISOString(), author: 'Sistema' }]
                }));
                setHighlightedField('plantel_interes');
            }
        },
        { 
            author: 'bot', 
            text: '¡Perfecto! *Casa Blanca* es excelente. 🌟\n\nHorarios disponibles:\n• *Sábado Matutino:* 8:00 a.m. – 12:00 p.m.\n• *Sábado Vespertino:* 1:00 p.m. – 5:00 p.m.\n• *Martes/Jueves:* 6:00 p.m. – 9:40 p.m.\n\n¿Cuál se adapta mejor a tu horario?', 
            delay: 2800,
            action: () => {
                setProspecto(p => ({ 
                    ...p, 
                    estado_embudo: 'Interesado',
                    probabilidad_conversion: 70,
                    resumen_ia: 'Se han presentado horarios disponibles. Prospecto evaluando opciones.',
                    notas_ia: 'Presentación de horarios completada. Prospecto en fase de evaluación logística. Respuesta rápida indicará alto interés.',
                    notas_manuales: [{ content: 'Evaluando horarios disponibles', timestamp: new Date().toISOString(), author: 'Sistema' }]
                }));
                setHighlightedField('probabilidad_conversion');
            }
        },
        { 
            author: 'user', 
            text: 'El sábado matutino me viene perfecto! 🌅 Trabajo entre semana y los fines de semana tengo más tiempo para dedicarle a los estudios', 
            delay: 1800,
            showCaptured: true,
            action: () => {
                setProspecto(p => ({ 
                    ...p, 
                    turno: 'Sábado Matutino',
                    probabilidad_conversion: 75,
                    score_interes: 85,
                    estado_embudo: 'Interes Concreto',
                    resumen_ia: 'Configuración completa: Ingeniería Industrial Casa Blanca Sábado Matutino. Prospecto muestra interés concreto.',
                    notas_ia: 'CONFIGURACIÓN ÓPTIMA: Horario seleccionado con justificación lógica. Prospecto demuestra planificación y compromiso. Probabilidad de conversión alta.',
                    notas_manuales: [{ content: 'Horario ideal para su situación laboral', timestamp: new Date().toISOString(), author: 'Sistema' }]
                }));
                setHighlightedField('score_interes');
            }
        },
        { 
            author: 'bot', 
            text: '¡Excelente! Tu plan está casi listo. 🚀\n\nPara agilizar tu inscripción, ¿tienes estos documentos?\n• *Acta de nacimiento* • *CURP*\n• *Comprobante de domicilio* • *Certificado de preparatoria*\n\n¡Esto nos ayuda a darte un servicio más rápido!', 
            delay: 3000,
            action: () => {
                setProspecto(p => ({ 
                    ...p, 
                    probabilidad_conversion: 80,
                    resumen_ia: 'Configuración completa. Se está verificando disponibilidad de documentos.',
                    notas_ia: 'Verificación de documentos iniciada. Respuesta positiva indicará preparación avanzada y alta intención de inscripción.',
                    notas_manuales: [{ content: 'Verificando documentos para inscripción', timestamp: new Date().toISOString(), author: 'Sistema' }]
                }));
                setHighlightedField('probabilidad_conversion');
            }
        },
        { 
            author: 'user', 
            text: 'Sí, tengo todos los documentos listos! 📄 Siempre me gusta tener todo organizado. ¿Cuándo puedo agendar una cita?', 
            delay: 1000,
            showCaptured: true,
            action: () => {
                setProspecto(p => ({ 
                    ...p, 
                    probabilidad_conversion: 90,
                    score_interes: 95,
                    estado_embudo: 'Listo para Cita',
                    resumen_ia: 'Prospecto tiene documentos listos y solicita cita. Alta probabilidad de conversión.',
                    notas_ia: 'PROSPECTO PREMIUM: Documentos listos + personalidad organizada + solicitud activa de cita = CONVERSIÓN INMEDIATA PROBABLE. Prioridad máxima.',
                    notas_manuales: [{ content: 'Documentos listos - Solicita cita activamente', timestamp: new Date().toISOString(), author: 'Sistema' }]
                }));
                setHighlightedField('estado_embudo');
            }
        },
        { 
            author: 'bot', 
            text: '¡Perfecto! 🎉\n\n*Tu configuración:*\n✅ Ingeniería Industrial - Casa Blanca\n✅ Sábado Matutino\n✅ Documentos listos\n\n¿Agendamos tu cita de inscripción?', 
            delay: 2500,
            action: () => {
                setProspecto(p => ({ 
                    ...p, 
                    probabilidad_conversion: 95,
                    resumen_ia: 'CONFIGURACIÓN COMPLETA: Ingeniería Industrial Casa Blanca Sábado Matutino. Prospecto listo para agendar cita. Excelente probabilidad de cierre.',
                    notas_ia: 'MOMENTO DE CIERRE: Configuración completa verificada. Prospecto en punto óptimo de conversión. Proceder con agendamiento inmediato.',
                    notas_manuales: [{ content: 'LISTO PARA CIERRE - Excelente prospecto', timestamp: new Date().toISOString(), author: 'Sistema' }]
                }));
                setHighlightedField('resumen_ia');
            }
        },
        { 
            author: 'user', 
            text: '¡Sí, perfecto! 📅 Quiero agendar una cita para mañana a la 1 de la tarde. ¿Está disponible ese horario?', 
            delay: 1500,
            showCaptured: true,
            action: () => {
                setProspecto(p => ({ 
                    ...p, 
                    probabilidad_conversion: 98,
                    estado_embudo: 'Cita Agendada',
                    resumen_ia: 'CITA CONFIRMADA: Mañana 1:00 PM. Prospecto completamente cualificado y listo para inscripción.',
                    notas_ia: 'CONVERSIÓN EXITOSA: Cita solicitada con horario específico. Prospecto demuestra urgencia y compromiso. Éxito prácticamente garantizado.',
                    notas_manuales: [{ content: 'CITA AGENDADA - Mañana 1:00 PM', timestamp: new Date().toISOString(), author: 'Sistema' }]
                }));
                setHighlightedField('estado_embudo');
            }
        },
        { 
            author: 'bot', 
            text: '¡Claro! Solo para confirmar, ¿cuál es tu nombre completo?', 
            delay: 1500,
            action: () => {}
        },
        { 
            author: 'user', 
            text: 'Ulises Avitia', 
            delay: 1000,
            showCaptured: true,
            action: () => {
                setProspecto(p => ({ 
                    ...p, 
                    nombre: 'Ulises Avitia',
                    resumen_ia: 'NOMBRE COMPLETO RECIBIDO: Ulises Avitia. Cita confirmada.',
                    notas_ia: 'Nombre completo verificado. El prospecto ahora está completamente identificado.'
                }));
                setHighlightedField('nombre');
            }
        },
        { 
            author: 'bot', 
            text: '¡Excelente, Ulises! 🎯 Tu cita está confirmada:\n\n📅 *Fecha:* Mañana\n🕐 *Hora:* 1:00 PM\n📍 *Lugar:* Casa Blanca\n👩‍💼 *Asesora:* Samanta\n\n*He agregado el evento a tu Google Calendar automáticamente.* ✅\n\n¡Nos vemos mañana para completar tu inscripción!', 
            delay: 3000,
            action: () => {
                // Crear evento en Google Calendar
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(13, 0, 0, 0); // 1:00 PM
                
                const endTime = new Date(tomorrow);
                endTime.setHours(14, 0, 0, 0); // 2:00 PM
                
                const formatDate = (date: Date) => {
                    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                };
                
                const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Cita de Inscripción - Instituto Educativo Baja California')}&dates=${formatDate(tomorrow)}/${formatDate(endTime)}&details=${encodeURIComponent('Cita de inscripción para Ingeniería Industrial\n\nProspecto: Ulises\nCarrera: Ingeniería Industrial\nPlantel: Casa Blanca\nHorario: Sábado Matutino\nAsesora: Samanta\n\nDocumentos necesarios:\n- Acta de nacimiento\n- CURP\n- Comprobante de domicilio\n- Certificado de preparatoria')}&location=${encodeURIComponent('Instituto Educativo Baja California - Campus Casa Blanca')}&sf=true&output=xml`;
                
                // Abrir Google Calendar después de un pequeño delay
                setTimeout(() => {
                    window.open(calendarUrl, '_blank');
                }, 1000);
                
                setProspecto(p => ({ 
                    ...p, 
                    probabilidad_conversion: 100,
                    estado_embudo: 'Cita Confirmada',
                    resumen_ia: 'ÉXITO TOTAL: Cita agendada para mañana 1:00 PM. Evento creado en Google Calendar. Prospecto 100% convertido.',
                    notas_ia: 'MISIÓN CUMPLIDA: Conversión completada exitosamente. Cita confirmada, calendario sincronizado. Prospecto de alta calidad procesado eficientemente.',
                    notas_manuales: [{ content: 'CONVERSIÓN EXITOSA - Cita confirmada en Google Calendar', timestamp: new Date().toISOString(), author: 'Samanta' }]
                }));
                setHighlightedField('probabilidad_conversion');
            }
        }
    ];

    // --- Lógica de la Simulación ---
    const processNextMessage = () => {
        if (currentIndex >= script.length) {
            setIsSimulationRunning(false);
            return;
        }

        const item = script[currentIndex];
        const isBot = item.author === 'bot';

        if (isBot) {
            setIsTyping(true);
        }

        timeoutRef.current = setTimeout(() => {
            if (isBot) {
                setIsTyping(false);
            }

            // Agregar mensaje
            const newMessage = {
                author: item.author,
                text: item.text,
                id: messageIdRef.current++,
                showCaptured: item.showCaptured || false
            };
            setMessages(prev => [...prev, newMessage]);

            // Ejecutar acción DESPUÉS de mostrar el mensaje
            timeoutRef.current = setTimeout(() => {
                if (item.action) {
                    item.action();
                }
                
                setCurrentIndex(prev => prev + 1);
                
            }, 500);

        }, item.delay);
    };

    // Iniciar simulación
    useEffect(() => {
        if (!isSimulationRunning && currentIndex === 0) {
            setIsSimulationRunning(true);
            processNextMessage();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Procesar siguiente mensaje cuando currentIndex cambie
    useEffect(() => {
        if (isSimulationRunning && currentIndex > 0 && currentIndex < script.length) {
            timeoutRef.current = setTimeout(() => {
                processNextMessage();
            }, 800);
        }
    }, [currentIndex, isSimulationRunning]); // eslint-disable-line react-hooks/exhaustive-deps

    // Limpiar timeouts al desmontar
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // --- Scroll automático del chat ---
    useEffect(() => {
        if (chatContainerRef.current) {
            const container = chatContainerRef.current;
            // Usar setTimeout para asegurar que el DOM se haya actualizado
            setTimeout(() => {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }, [messages, isTyping]);

    // --- Scroll adicional para asegurar que siempre funcione ---
    useEffect(() => {
        if (chatContainerRef.current && messages.length > 0) {
            const container = chatContainerRef.current;
            // Scroll inmediato sin animación para asegurar que llegue al final
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
            }, 200);
        }
    }, [messages.length]);

    // --- Scroll automático y enfoque de campos actualizados ---
    useEffect(() => {
        if (highlightedField && prospectoCardRef.current) {
            const fieldElement = prospectoCardRef.current.querySelector(`[data-field="${highlightedField}"]`);
            if (fieldElement) {
                fieldElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }
        }
    }, [highlightedField]);

    // --- Resaltado temporal ---
    useEffect(() => {
        if (highlightedField) {
            const timer = setTimeout(() => setHighlightedField(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [highlightedField]);

    // --- Función para manejar llamada ---
    const handleCall = (numero: string) => {
        window.open(`tel:${numero}`, '_self');
    };

    return (
        <div className="demo-container flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
            
            {/* Panel Izquierdo: Simulación de Chat - ANCHO FIJO 50% */}
            <div className="w-1/2 p-4 flex flex-col h-full">
                <h2 className="text-2xl font-bold mb-4 text-center flex-shrink-0">Simulador de Chat</h2>
                <NeumorphicCard className="flex-1 flex flex-col min-h-0">
                    <div ref={chatContainerRef} className="chat-container flex-1 p-4 overflow-y-auto">
                        {messages.map((msg, index) => (
                            <ChatBubble 
                                key={msg.id} 
                                author={msg.author} 
                                text={msg.text} 
                                isNew={index === messages.length - 1}
                                showCaptured={msg.showCaptured}
                            />
                        ))}
                        {isTyping && (
                            <div className="flex items-end gap-3 mb-4 justify-end">
                                <div className="px-4 py-2.5 rounded-2xl bg-blue-600 shadow-sm rounded-br-sm">
                                    <div className="typing-indicator">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center overflow-hidden">
                                        <img 
                                            src="/bot-logo.png" 
                                            alt="Bot" 
                                            className="w-full h-full object-cover rounded-full"
                                            onError={(e) => {
                                                // Fallback al icono original si la imagen no carga
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.parentElement!.innerHTML = '<svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V7H1V9H3V15H1V17H3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V17H23V15H21V9H23ZM19 21H5V3H15V9H19V21Z"/></svg>';
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </NeumorphicCard>
            </div>

            {/* Panel Derecho: Monitor de Prospectos - ANCHO FIJO 50% */}
            <div className="w-1/2 p-4 flex flex-col h-full">
                <h2 className="text-2xl font-bold mb-4 text-center flex-shrink-0">Monitor de Prospectos (En Tiempo Real)</h2>
                <NeumorphicCard className="flex-1 min-h-0">
                    {/* Tarjeta de Prospecto */}
                    <div ref={prospectoCardRef} className="bg-white dark:bg-gray-800 p-6 rounded-xl h-full overflow-y-auto">
                        <div className="flex items-center gap-4 mb-6">
                           <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                               {prospecto.nombre && prospecto.nombre !== 'Esperando contacto...' ? prospecto.nombre.charAt(0).toUpperCase() : '?'}
                           </div>
                           <div className="flex-1">
                               <h3 className={`text-xl font-bold transition-all duration-500 ${isHighlighted('nombre') ? 'highlight-flash' : ''}`} data-field="nombre">
                                   {prospecto.nombre}
                               </h3>
                               <p className="text-sm text-gray-500 dark:text-gray-400">Prospecto Activo</p>
                               {/* Botón de Llamar Mejorado */}
                               {prospecto.numero_telefono && (
                                   <button 
                                       onClick={() => handleCall(prospecto.numero_telefono!)}
                                       className="mt-3 flex items-center gap-2 bg-slate-600 hover:bg-slate-700 active:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                                   >
                                       <Phone className="w-4 h-4" />
                                       Llamar Ahora
                                   </button>
                               )}
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-4 mb-6">
                            {/* Número de Teléfono */}
                            <div data-field="numero_telefono">
                                <DetailItem icon={<Phone size={20} />} label="Número de Teléfono" value={prospecto.numero_telefono} isHighlighted={highlightedField === 'numero_telefono'} />
                            </div>
                            <div data-field="carrera_interes">
                                <DetailItem icon={<GraduationCap size={20} />} label="Carrera de Interés" value={prospecto.carrera_interes} isHighlighted={highlightedField === 'carrera_interes'} />
                            </div>
                            <div data-field="plantel_interes">
                                <DetailItem icon={<Building size={20} />} label="Plantel de Interés" value={prospecto.plantel_interes} isHighlighted={highlightedField === 'plantel_interes'} />
                            </div>
                            <div data-field="turno">
                                <DetailItem icon={<Clock size={20} />} label="Turno" value={prospecto.turno} isHighlighted={highlightedField === 'turno'} />
                            </div>
                            <div data-field="estado_embudo">
                                <DetailItem icon={<Zap size={20} />} label="Estado del Embudo" value={prospecto.estado_embudo} isHighlighted={highlightedField === 'estado_embudo'} />
                            </div>
                            <div data-field="score_interes">
                                <DetailItem icon={<Target size={20} />} label="Score de Interés" isHighlighted={highlightedField === 'score_interes'}>
                                   <div className="flex items-center gap-2">
                                       <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                           <div className="bg-orange-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${prospecto.score_interes || 0}%` }}></div>
                                       </div>
                                       <span className="font-bold text-orange-500 min-w-[40px]">{prospecto.score_interes || 0}%</span>
                                   </div>
                                </DetailItem>
                            </div>
                            <div data-field="probabilidad_conversion">
                                <DetailItem icon={<TrendingUp size={20} />} label="Probabilidad de Conversión" isHighlighted={highlightedField === 'probabilidad_conversion'}>
                                   <div className="flex items-center gap-2">
                                       <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                           <div className="bg-green-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${prospecto.probabilidad_conversion || 0}%` }}></div>
                                       </div>
                                       <span className="font-bold text-green-500 min-w-[40px]">{prospecto.probabilidad_conversion || 0}%</span>
                                   </div>
                                </DetailItem>
                            </div>
                        </div>
                        
                        <hr className="my-6 border-gray-200 dark:border-gray-700" />

                        <div data-field="resumen_ia">
                            <DetailItem icon={<Sparkles size={20} />} label="Resumen por IA" isHighlighted={highlightedField === 'resumen_ia'}>
                                <p className="text-gray-800 dark:text-gray-200 font-medium whitespace-pre-wrap leading-relaxed">
                                    {prospecto.resumen_ia}
                                </p>
                            </DetailItem>
                        </div>

                        <hr className="my-6 border-gray-200 dark:border-gray-700" />

                        {/* Caja de Comentarios Premium */}
                        <div data-field="notas_manuales">
                            <DetailItem icon={<MessageCircle size={20} />} label="Comentarios en Tiempo Real" isHighlighted={highlightedField === 'notas_manuales'}>
                                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg shadow-gray-200/20 dark:shadow-gray-900/20 overflow-hidden backdrop-blur-sm">
                                    {/* Área de historial scrolleable premium */}
                                    <div className="max-h-48 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-300/60 dark:scrollbar-thumb-gray-600/60 scrollbar-track-transparent hover:scrollbar-thumb-gray-400/80 dark:hover:scrollbar-thumb-gray-500/80 transition-all duration-300">
                                        
                                        {/* Comentarios de IA dinámicos basados en el progreso */}
                                        {prospecto.score_interes && prospecto.score_interes > 0 && (
                                            <div className="animate-slide-in opacity-0 comment-item" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
                                                <div className="flex items-center gap-3 group">
                                                    <div className="bg-blue-600 dark:bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300">
                                                        <span className="text-xs font-semibold text-white">IA</span>
                                                    </div>
                                                    <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 group-hover:scale-[1.02]">
                                                        <p className="text-blue-700 dark:text-blue-300 text-xs font-medium">
                                                            Score: {prospecto.score_interes}% • Prob: {prospecto.probabilidad_conversion}%
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {prospecto.carrera_interes && prospecto.carrera_interes !== '...' && (
                                            <div className="animate-slide-in opacity-0 comment-item" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
                                                <div className="flex items-center gap-3 group">
                                                    <div className="bg-blue-600 dark:bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300">
                                                        <span className="text-xs font-semibold text-white">IA</span>
                                                    </div>
                                                    <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 group-hover:scale-[1.02]">
                                                        <p className="text-blue-700 dark:text-blue-300 text-xs font-medium">
                                                            Interés detectado: {prospecto.carrera_interes}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {prospecto.estado_embudo && prospecto.estado_embudo !== 'Sin contacto' && (
                                            <div className="animate-slide-in opacity-0 comment-item" style={{ animationDelay: '1.5s', animationFillMode: 'forwards' }}>
                                                <div className="flex items-center gap-3 group">
                                                    <div className="bg-blue-600 dark:bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300">
                                                        <span className="text-xs font-semibold text-white">IA</span>
                                                    </div>
                                                    <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 group-hover:scale-[1.02]">
                                                        <p className="text-blue-700 dark:text-blue-300 text-xs font-medium">
                                                            Estado actualizado: {prospecto.estado_embudo}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Comentario final del humano (aparece al final) */}
                                        {prospecto.estado_embudo === 'Cita Agendada' && (
                                            <div className="animate-slide-in opacity-0 comment-item" style={{ animationDelay: '2s', animationFillMode: 'forwards' }}>
                                                <div className="flex items-center gap-3 group">
                                                    <div className="bg-slate-600 dark:bg-slate-500 rounded-full w-6 h-6 flex items-center justify-center shadow-lg shadow-slate-500/25 group-hover:shadow-slate-500/40 transition-all duration-300">
                                                        <span className="text-xs font-semibold text-white">👤</span>
                                                    </div>
                                                    <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 group-hover:scale-[1.02]">
                                                        <p className="text-slate-700 dark:text-slate-300 text-xs font-medium">
                                                            ✅ Cita confirmada por asesor humano
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Placeholder cuando no hay comentarios */}
                                        {(!prospecto.score_interes || prospecto.score_interes === 0) && (
                                            <div className="flex items-center justify-center py-6">
                                                <div className="text-gray-400 dark:text-gray-500 text-xs italic flex items-center gap-2">
                                                    <MessageCircle size={14} className="opacity-50" />
                                                    Esperando interacción del prospecto...
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </DetailItem>
                        </div>

                    </div>
                </NeumorphicCard>
            </div>

            {/* Estilos para animaciones */}
            <style>{`
                /* Asegurar que el contenedor principal ocupe toda la altura */
                .demo-container {
                    height: 100vh;
                    max-height: 100vh;
                    overflow: hidden;
                    width: 100vw;
                    max-width: 100vw;
                }
                
                /* Asegurar que el chat scroll funcione correctamente */
                .chat-container {
                    max-height: 100%;
                    overflow-y: auto;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(0, 0, 0, 0.3) transparent;
                }
                
                .chat-container::-webkit-scrollbar {
                    width: 6px;
                }
                
                .chat-container::-webkit-scrollbar-track {
                    background: transparent;
                }
                
                .chat-container::-webkit-scrollbar-thumb {
                    background-color: rgba(0, 0, 0, 0.3);
                    border-radius: 3px;
                }
                
                @keyframes highlight-flash-anim {
                    0%, 100% { 
                        background-color: transparent; 
                        box-shadow: none;
                    }
                    50% { 
                        background-color: rgba(59, 130, 246, 0.15); 
                        box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
                    }
                }
                .highlight-flash {
                    animation: highlight-flash-anim 4s ease-in-out;
                    border-radius: 8px;
                }
                
                @keyframes slide-in {
                    from { 
                        opacity: 0; 
                        transform: translateY(12px) scale(0.96); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0) scale(1); 
                    }
                }
                .animate-slide-in {
                    animation: slide-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                /* Animación de aparición suave premium */
                @keyframes fade-in-up {
                    from { 
                        opacity: 0; 
                        transform: translateY(10px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0); 
                    }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                /* Hover suave para comentarios */
                .comment-item {
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .comment-item:hover {
                    transform: translateY(-1px);
                }

                /* Scrollbar premium */
                .scrollbar-thin::-webkit-scrollbar {
                    width: 4px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: transparent;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: rgba(156, 163, 175, 0.4);
                    border-radius: 2px;
                    transition: all 0.3s ease;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: rgba(156, 163, 175, 0.6);
                }
                
                .typing-indicator {
                    display: flex;
                    gap: 4px;
                    align-items: center;
                }
                .typing-indicator span {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background-color: rgba(255, 255, 255, 0.8);
                    animation: typing 1.4s infinite ease-in-out;
                }
                .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
                .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
                .typing-indicator span:nth-child(3) { animation-delay: 0s; }
                
                @keyframes typing {
                    0%, 80%, 100% { 
                        transform: scale(0.8); 
                        opacity: 0.5; 
                    }
                    40% { 
                        transform: scale(1); 
                        opacity: 1; 
                    }
                }
            `}</style>
        </div>
    );
};

export default DemoView; 