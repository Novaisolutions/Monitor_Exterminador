import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus, Edit2, Trash2, Search, User, GraduationCap, MapPin, Clock, Phone,
  Calendar, MessageCircle, Zap, ArrowUp, ArrowDown, Minus, ChevronDown, ChevronUp,
  Sparkles, Tag, FileText, List, X, Briefcase, HelpCircle, MessageSquare, Timer, 
  Activity, RefreshCw, Building2, CheckCircle2
} from 'lucide-react';
import useProspectos from '../../hooks/useProspectos';
import { useSeguimientoStats } from '../../hooks/useSeguimientoStats';
import useKommo from '../../hooks/useKommo';
import { ProspectoMkt, Conversacion } from '../../types/database';
import { supabase } from '../../lib/supabase';
import { normalizeEstadoEmbudo } from '../../lib/utils';

// Hook auxiliar para obtener el valor previo de una prop o estado
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

type Note = { content: string; created_at: string; author: string };



const NeumorphicCard: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl shadow-lg dark:shadow-2xl dark:shadow-black/20 border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${className || ''} ${onClick ? 'cursor-pointer' : ''}`}
  >
    {children}
  </div>
);

const NeumorphicButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode; variant?: 'primary' | 'secondary' | 'icon' }> = ({ children, className, variant = 'primary', ...props }) => {
  let baseStyle = 'px-4 py-2 rounded-lg font-semibold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center justify-center gap-2 text-sm';
  if (variant === 'primary') {
    baseStyle += ' bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500';
  } else if (variant === 'secondary') {
    baseStyle += ' bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-gray-400';
  } else if (variant === 'icon') {
    baseStyle += ' bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-100 !p-2 rounded-full';
  }

  if (props.disabled) {
    baseStyle += ' opacity-50 cursor-not-allowed';
  }

  return (
    <button {...props} className={`${baseStyle} ${className || ''}`}>
      {children}
    </button>
  );
};

const NeumorphicInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }> = ({ icon, ...props }) => (
    <div className="relative w-full">
        {icon && <span className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">{icon}</span>}
        <input
        {...props}
        className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500 transition-all`}
        />
    </div>
);

const NeumorphicSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
 <div className="relative">
    <select
      {...props}
      className="w-full pl-3 pr-10 py-2.5 appearance-none border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
    />
    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5 pointer-events-none" />
  </div>
);

const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value?: string | number | string[] | null | React.ReactNode; className?: string; valueClassName?: string; isHighlighted?: boolean; }> = ({ icon, label, value, className, valueClassName, isHighlighted }) => {
  const isValueEmpty = value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);

  if (isValueEmpty) {
    return null;
  }
  return (
    <div className={`flex items-start gap-3 text-sm p-2 rounded-lg transition-all duration-300 ${isHighlighted ? 'highlight-flash' : ''} ${className || ''}`}>
      <span className="text-blue-500 dark:text-blue-400 mt-1 flex-shrink-0 w-5 h-5">{icon}</span>
      <div className="flex-1 break-words min-w-0">
        <p className="font-medium text-gray-600 dark:text-gray-300">{label}</p>
        <div className={`mt-0.5 text-gray-800 dark:text-gray-100 ${valueClassName || ''}`}>
          {Array.isArray(value) && typeof value[0] !== 'object' ? value.join(', ') : value}
        </div>
      </div>
    </div>
  );
};

// Tipo de formulario desacoplado del esquema para evitar errores de TS con campos extra
type ProspectoFormData = {
  nombre: string;
  numero_telefono: string;
  estado_embudo: string;
  prioridad: string;
  plaga_a_erradicar: string;
  producto_adquirido: string;
  presupuesto_aproximado?: number;
  experiencia_previa_plagas: string;
  urgencia_exterminio: string;
};

const ProspectoFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  prospecto: ProspectoMkt | null;
  onSave: (data: Partial<ProspectoMkt>, id?: number) => void;
}> = ({ isOpen, onClose, prospecto, onSave }) => {
  const [formData, setFormData] = useState<ProspectoFormData>({
    nombre: '',
    numero_telefono: '',
    estado_embudo: 'lead',
    prioridad: 'media',
    plaga_a_erradicar: '',
    producto_interes: '',
    presupuesto_aproximado: undefined as any,
    experiencia_previa_plagas: '',
    urgencia_exterminio: ''
  });

  useEffect(() => {
    if (prospecto) {
      setFormData({
        nombre: prospecto.nombre || '',
        numero_telefono: prospecto.numero_telefono || '',
        estado_embudo: prospecto.estado_embudo || 'lead',
        prioridad: prospecto.prioridad || 'media',
        plaga_a_erradicar: (prospecto as any).plaga_a_erradicar || '',
        producto_adquirido: (prospecto as any).producto_adquirido || '',
        presupuesto_aproximado: (prospecto as any).presupuesto_aproximado || undefined,
        experiencia_previa_plagas: (prospecto as any).experiencia_previa_plagas || '',
        urgencia_exterminio: (prospecto as any).urgencia_exterminio || ''
      });
    } else {
      setFormData({
        nombre: '',
        numero_telefono: '',
        estado_embudo: 'lead',
        prioridad: 'media',
        plaga_a_erradicar: '',
        producto_interes: '',
        presupuesto_aproximado: undefined as any,
        experiencia_previa_plagas: '',
        urgencia_exterminio: ''
      });
    }
  }, [prospecto, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value as any }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, prospecto?.id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <NeumorphicCard className="w-full max-w-lg max-h-[90vh] !p-0">
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {prospecto ? 'Editar Prospecto' : 'Nuevo Prospecto'}
          </h2>
          <NeumorphicButton onClick={onClose} variant="icon" className="!p-2">
            <X size={20} />
          </NeumorphicButton>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          <NeumorphicInput name="nombre" placeholder="Nombre Completo" value={formData.nombre || ''} onChange={handleChange} icon={<User size={16}/>} required/>
          <NeumorphicInput name="numero_telefono" placeholder="Número de Teléfono" value={formData.numero_telefono || ''} onChange={handleChange} icon={<Phone size={16}/>} required/>
          <NeumorphicInput name="plaga_a_erradicar" placeholder="Tipo de plaga a erradicar" value={formData.plaga_a_erradicar || ''} onChange={handleChange} icon={<HelpCircle size={16}/>} />
          <NeumorphicInput name="producto_adquirido" placeholder="Producto de interés" value={formData.producto_adquirido || ''} onChange={handleChange} icon={<GraduationCap size={16}/>} />
          <NeumorphicInput name="presupuesto_aproximado" placeholder="Presupuesto aproximado" value={formData.presupuesto_aproximado ?? ''} onChange={handleChange} icon={<Activity size={16}/>} />
          <NeumorphicInput name="experiencia_previa_plagas" placeholder="Experiencia previa con plagas" value={formData.experiencia_previa_plagas || ''} onChange={handleChange} icon={<FileText size={16}/>} />
          <NeumorphicInput name="urgencia_exterminio" placeholder="Urgencia del exterminio (alta/media/baja)" value={formData.urgencia_exterminio || ''} onChange={handleChange} icon={<Clock size={16}/>} />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estado del Embudo</label>
            <NeumorphicSelect name="estado_embudo" value={formData.estado_embudo || 'lead'} onChange={handleChange}>
              {Object.entries(ESTADOS).map(([key, {label}]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </NeumorphicSelect>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prioridad</label>
            <NeumorphicSelect name="prioridad" value={formData.prioridad || 'media'} onChange={handleChange}>
              {Object.entries(PRIORIDADES).map(([key, {label}]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </NeumorphicSelect>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
            <NeumorphicButton type="button" onClick={onClose} variant="secondary">
              Cancelar
            </NeumorphicButton>
            <NeumorphicButton type="submit" variant="primary">
              {prospecto ? 'Guardar Cambios' : 'Crear Prospecto'}
            </NeumorphicButton>
          </div>
        </form>
      </NeumorphicCard>
    </div>
  );
};

const Emojis = {
  muy_positivo: '😃',
  positivo: '😊',
  neutral: '😐',
  negativo: '😟',
  muy_negativo: '😠',
  entusiasta: '🤩',
  dubitativo: '🤔',
  frustrado: '😤',
  agradecido: '🙏',
  curioso: '🧐',
};

const ESTADOS: Record<string, { color: string; label: string; icon: React.ReactNode; bgColor: string }> = {
    'lead': { color: 'text-sky-500 bg-sky-100 dark:bg-sky-500/20 dark:text-sky-400', label: 'Nuevo Lead', icon: <Sparkles size={14}/>, bgColor: 'dark:bg-sky-500/10 bg-sky-50' },
    'contactado': { color: 'text-blue-500 bg-blue-100 dark:bg-blue-500/20 dark:text-blue-400', label: 'Contactado', icon: <Phone size={14}/>, bgColor: 'dark:bg-blue-500/10 bg-blue-50' },
    'llamar_mas_tarde': { color: 'text-amber-500 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-400', label: 'Contactar más tarde', icon: <Clock size={14}/>, bgColor: 'dark:bg-amber-500/10 bg-amber-50' },
    'cotizacion_solicitada': { color: 'text-purple-500 bg-purple-100 dark:bg-purple-500/20 dark:text-purple-400', label: 'Cotización Solicitada', icon: <MessageSquare size={14}/>, bgColor: 'dark:bg-purple-500/10 bg-purple-50' },
    'compra_realizada': { color: 'text-green-500 bg-green-100 dark:bg-green-500/20 dark:text-green-400', label: 'Compra Realizada', icon: <CheckCircle2 size={14}/>, bgColor: 'dark:bg-green-500/10 bg-green-50' },
    'cliente': { color: 'text-teal-500 bg-teal-100 dark:bg-teal-500/20 dark:text-teal-400', label: 'Cliente', icon: <Calendar size={14}/>, bgColor: 'dark:bg-teal-500/10 bg-teal-50' },
};

const ESTADOS_SIDEBAR = ['todos', ...Object.keys(ESTADOS).filter(key => key !== 'lead')];

const getEstadoInfo = (estado?: string | null) => {
    if (!estado || !ESTADOS[estado]) {
        if (estado === 'todos') {
            return { color: 'text-gray-500', label: 'Todos los Prospectos', icon: <List size={14}/>, bgColor: 'bg-transparent' };
        }
        if (estado && !ESTADOS[estado]) {
            return { color: 'text-gray-500 bg-gray-100 dark:bg-gray-500/20 dark:text-gray-400', label: estado, icon: <HelpCircle size={14}/>, bgColor: 'dark:bg-gray-500/10 bg-gray-50' };
        }
        return ESTADOS.lead;
    }
    return ESTADOS[estado];
};

const PRIORIDADES: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  'alta': { color: 'text-red-500', label: 'Alta', icon: <ArrowUp size={16} /> },
  'media': { color: 'text-amber-500', label: 'Media', icon: <Minus size={16} /> },
  'baja': { color: 'text-sky-500', label: 'Baja', icon: <ArrowDown size={16} /> }
};

const getPriorityVisual = (prioridad?: string | null) => prioridad ? (PRIORIDADES[prioridad] || PRIORIDADES.media) : PRIORIDADES.media;

const getScoreColor = (score?: number | null) => {
  if (score === undefined || score === null) return 'text-slate-500 dark:text-slate-400';
  if (score >= 80) return 'text-emerald-500 dark:text-emerald-400 font-bold';
  if (score >= 60) return 'text-amber-500 dark:text-amber-400 font-semibold';
  if (score >= 40) return 'text-orange-500 dark:text-orange-400';
  return 'text-red-500 dark:text-red-400';
};

const formatTags = (tags?: string[] | null) => {
  if (!tags || tags.length === 0) return <span className="text-gray-500 dark:text-gray-400 italic text-xs">Ninguna</span>;
  return (<div className="flex flex-wrap gap-1.5 mt-1">
    {tags.map((tag, index) => (
    <span key={index} className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold px-2.5 py-1 rounded-full">
      {tag}
    </span>
  ))}
  </div>)
};

const formatDate = (dateString?: string | null) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('es-MX', { year: '2-digit', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return 'Fecha inválida';
  }
};

interface ProspectosViewProps {
  conversations: Conversacion[];
  onSelectConversation: (numero: string) => void;
}

const ProspectosView: React.FC<ProspectosViewProps> = ({ conversations, onSelectConversation }) => {
  const { prospectos, loading, error, createProspecto, updateProspecto, deleteProspecto, clearError, highlightedFields } = useProspectos();
  const { createLead, createContact, pipelines, leads } = useKommo();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProspecto, setEditingProspecto] = useState<ProspectoMkt | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('todos');
  const [selectedProspecto, setSelectedProspecto] = useState<ProspectoMkt | null>(null);
  const [productos, setProductos] = useState<string[]>([]);
  const [selectedProducto, setSelectedProducto] = useState('todos');
  const [sendingToKommo, setSendingToKommo] = useState<string | null>(null);
  const prevProspectos = usePrevious(prospectos);

  // --- El "Vigilante" que replica el cambio de filtro manual ---
  useEffect(() => {
    // Asegurarse de que tenemos datos previos para comparar
    if (!prevProspectos || prospectos.length === 0) {
      return;
    }

    // Buscar si algún prospecto acaba de transicionar al estado "agendó cita"
    const prospectoQueAgendo = prospectos.find(currentProspecto => {
      const prevVersion = prevProspectos.find(p => p.id === currentProspecto.id);
      if (!prevVersion) return false; // Es un prospecto nuevo, no una transición

      // Comprobar si el estado ha cambiado a "agendó cita"
      const transitioned = normalizeEstadoEmbudo(currentProspecto.estado_embudo) === 'agendó cita.' && normalizeEstadoEmbudo(prevVersion.estado_embudo) !== 'agendó cita.';
      return transitioned;
    });

    // Si encontramos uno, forzamos el cambio de filtro
    if (prospectoQueAgendo) {
      setActiveFilter('agendó cita.');
    }
  }, [prospectos]); // Se ejecuta cada vez que la lista de prospectos cambia

  useEffect(() => {
    if (error) {
      alert(`Error: ${error}`);
      clearError();
    }
  }, [error, clearError]);

  useEffect(() => {
    const fetchProductos = async () => {
      const { data, error } = await supabase
        .from('prospectos_xt_mkt')
        .select('producto_adquirido');
      
      if (error) {
        console.error('Error fetching productos:', error);
        return;
      }

      const productosUnicos = Array.from(new Set(data.map(p => (p as any).producto_adquirido).filter(Boolean))) as string[];
      setProductos(productosUnicos);
    };

    fetchProductos();
  }, []);

  const filteredProspectos = useMemo(() => {
    return prospectos.filter(p => {
      let stateMatch = false;
      if (activeFilter === 'agendó cita.') {
        stateMatch = normalizeEstadoEmbudo(p.estado_embudo) === 'agendó cita.';
      } else if (activeFilter === 'cita solicitada') {
        // Manejar tanto "cita solicitada" como "cita_solicitada"
        stateMatch = p.estado_embudo === 'cita solicitada' || p.estado_embudo === 'cita_solicitada';
      } else {
        stateMatch = activeFilter === 'todos' || (p.estado_embudo || 'lead') === activeFilter;
      }

      const productoMatch = selectedProducto === 'todos' || (p as any).producto_adquirido === selectedProducto;
      
      if (!searchTerm) {
        return stateMatch && productoMatch;
      }

      const lowercasedTerm = searchTerm.toLowerCase();
      const searchMatch = 
        p.nombre?.toLowerCase().includes(lowercasedTerm) ||
        p.numero_telefono?.toLowerCase().includes(lowercasedTerm) ||
        (p as any).producto_adquirido?.toLowerCase().includes(lowercasedTerm) ||
        (p as any).plaga_a_erradicar?.toLowerCase().includes(lowercasedTerm);

      return stateMatch && productoMatch && searchMatch;
    });
  }, [prospectos, activeFilter, searchTerm, selectedProducto]);

  useEffect(() => {
    if (!selectedProspecto) return;
      const freshProspecto = prospectos.find(p => p.id === selectedProspecto.id);
    if (!freshProspecto) return;
    // Actualizar si cambió updated_at o si cambió explícitamente el resumen_ia
    const updatedAtChanged = freshProspecto.updated_at !== selectedProspecto.updated_at;
    const resumenChanged = (freshProspecto as any).resumen_ia !== (selectedProspecto as any).resumen_ia;
    if (updatedAtChanged || resumenChanged) {
        setSelectedProspecto(freshProspecto);
    }
  }, [prospectos, selectedProspecto]);

  useEffect(() => {
    if (filteredProspectos.length > 0) {
      if (!selectedProspecto || !filteredProspectos.find(p => p.id === selectedProspecto.id)) {
        setSelectedProspecto(filteredProspectos[0]);
      }
    } else {
      setSelectedProspecto(null);
    }
  }, [filteredProspectos]);

  const handleSaveProspecto = async (data: Partial<ProspectoMkt>, id?: number) => {
    try {
      if (id) {
        await updateProspecto(id, data);
      } else {
        await createProspecto(data as ProspectoMkt);
      }
      setEditingProspecto(null);
      setShowForm(false);
    } catch (e) {
      console.error("Error al guardar:", e);
    }
  };

  const handleAddNew = () => {
    setEditingProspecto(null);
    setShowForm(true);
  };

  const handleSendToKommo = async (prospecto: ProspectoMkt) => {
    if (!createLead) {
      alert('Error: No se puede conectar a Kommo');
      return;
    }

    try {
      setSendingToKommo(prospecto.id.toString());
      
      // Debug: Analizar leads existentes para mapeo
      console.log('=== ANÁLISIS DE LEADS EXISTENTES ===');
      console.log('Total leads disponibles:', leads.length);
      
      // Tomar algunos leads como muestra para ver su estructura
      const sampleLeads = leads.slice(0, 3);
      sampleLeads.forEach((lead, index) => {
        console.log(`\n📋 Lead muestra ${index + 1}:`, {
          id: lead.id,
          name: lead.name,
          price: lead.price,
          status_id: lead.status_id,
          pipeline_id: lead.pipeline_id,
          custom_fields: lead.custom_fields_values,
          contacts: lead._embedded?.contacts?.map(c => ({
            id: c.id,
            name: c.name,
            custom_fields: c.custom_fields_values
          }))
        });
      });

      // Debug: Ver todos los pipelines disponibles
      console.log('\n=== DEBUG PIPELINES ===');
      console.log('Total pipelines disponibles:', pipelines.length);
      pipelines.forEach((pipeline, index) => {
        console.log(`Pipeline ${index + 1}:`, {
          id: pipeline.id,
          name: pipeline.name,
          statuses: pipeline._embedded?.statuses?.map(s => ({ id: s.id, name: s.name }))
        });
      });
      
      // Buscar el pipeline de Mayo Dental (ID 10619619) y obtener sus status
      const mayoPipeline = pipelines.find(p => p.id === 10619619);
      const statuses = mayoPipeline?._embedded?.statuses || [];
      
      console.log('=== PIPELINE MAYO DENTAL ===');
      console.log('Pipeline Mayo Dental encontrado:', mayoPipeline);
      console.log('Todos los statuses disponibles:', statuses.map(s => ({ 
        id: s.id, 
        name: s.name, 
        sort: s.sort, 
        is_editable: s.is_editable 
      })));
      
      // Intentar con diferentes status hasta encontrar uno válido
      let selectedStatus = null;
      const statusesToTry = [
        statuses[1], // Segundo status (puede ser más permisivo)
        statuses[0], // Primer status (original)
        statuses[2], // Tercer status
      ].filter(Boolean);
      
      console.log('Status a probar en orden:', statusesToTry.map(s => ({ id: s.id, name: s.name })));
      
      if (statusesToTry.length === 0) {
        throw new Error('No se encontraron status disponibles en el pipeline de Mayo Dental');
      }
      
      // Por ahora usar el segundo status si existe, sino el primero
      selectedStatus = statusesToTry[0];
      console.log('Status seleccionado:', selectedStatus);
      
      // 🎯 MAPEO INTELIGENTE DE PROSPECTO A KOMMO LEAD
      console.log('\n=== MAPEO DE DATOS PROSPECTO → KOMMO ===');
      console.log('📊 Datos originales del prospecto:', {
        nombre: prospecto.nombre,
        telefono: prospecto.numero_telefono,
        estado_embudo: prospecto.estado_embudo,
        score_interes: prospecto.score_interes,
        presupuesto: prospecto.presupuesto_mencionado,
        urgencia: prospecto.urgencia_detectada,
        carrera_interes: prospecto.carrera_interes,
        plantel_interes: prospecto.plantel_interes
      });
      
      // 💰 SISTEMA INTELIGENTE DE PRECIOS PARA TRATAMIENTOS DENTALES
      const calculateDentalPrice = (prospecto: any) => {
        // Si ya mencionó un presupuesto, usarlo
        if (prospecto.presupuesto_mencionado && prospecto.presupuesto_mencionado > 0) {
          return prospecto.presupuesto_mencionado;
        }
        
        // Mapeo de productos de exterminio y sus precios
        const productPrices: { [key: string]: number } = {
          // Productos principales
          'kit comercial cucarachas': 14500,
          'kit cucarachas': 14500,
          'cucarachas': 14500,
          'kit exterminador': 14500,
          
          // Productos por tipo de plaga
          'hormigas': 8500,
          'kit hormigas': 8500,
          'roedores': 12000,
          'kit roedores': 12000,
          'ratas': 12000,
          'ratones': 10000,
          
          // Productos especializados
          'termitas': 18000,
          'kit termitas': 18000,
          'chinches': 15000,
          'kit chinches': 15000,
          'moscas': 6500,
          'kit moscas': 6500,
          
          // Tratamientos residenciales
          'residencial básico': 8000,
          'residencial completo': 15000,
          'residencial premium': 25000,
          
          // Tratamientos comerciales
          'comercial básico': 12000,
          'comercial completo': 22000,
          'comercial premium': 35000,
          
          // Servicios adicionales
          'fumigación': 8000,
          'desinfección': 6000,
          'control preventivo': 4500,
          'seguimiento': 2500
        };
        
        // Buscar productos mencionados en los datos del prospecto
        const searchText = [
          prospecto.plaga_a_erradicar,
          prospecto.producto_interes,
          prospecto.ultima_intencion,
          prospecto.notas_ia,
          prospecto.resumen_ia
        ].filter(Boolean).join(' ').toLowerCase();
        
        console.log('🔍 Buscando productos en:', searchText);
        
        let detectedProducts = [];
        let maxPrice = 0;
        
        for (const [product, price] of Object.entries(productPrices)) {
          if (searchText.includes(product)) {
            detectedProducts.push({ product, price });
            maxPrice = Math.max(maxPrice, price);
          }
        }
        
        console.log('🐛 Productos detectados:', detectedProducts);
        
        if (maxPrice > 0) {
          return maxPrice;
        }
        
        // Si tiene score alto, probablemente es un caso más complejo
        if (prospecto.score_interes && prospecto.score_interes > 80) {
          return 14500; // Kit Exterminador completo
        } else if (prospecto.score_interes && prospecto.score_interes > 60) {
          return 8500;  // Producto intermedio
        } else if (prospecto.score_interes && prospecto.score_interes > 40) {
          return 4500;  // Producto básico
        }
        
        // Precio base para consulta/cotización
        return 2500;
      };
      
      const estimatedPrice = calculateDentalPrice(prospecto);
      
      // Crear nombre descriptivo para el lead
      const leadName = [
        prospecto.nombre || 'Prospecto',
        prospecto.plaga_a_erradicar || prospecto.producto_interes ? 
          `(${prospecto.plaga_a_erradicar || prospecto.producto_interes})` : '',
        '- Exterminador'
      ].filter(Boolean).join(' ');
      
      console.log('💰 Precio calculado:', estimatedPrice);
      console.log('📝 Nombre del lead:', leadName);
      
      // 🏗️ CREAR LEAD COMPLETO COMO JOSÉ MELGOZA
      
      // 1️⃣ Primero crear el contacto si tenemos datos
      let createdContactId = null;
      if (prospecto.numero_telefono || prospecto.nombre) {
        try {
          console.log('\n=== 👤 CREANDO CONTACTO PRIMERO ===');
          
          const contactData = {
            name: prospecto.nombre || 'Prospecto Exterminador',
            phone: prospecto.numero_telefono,
            email: null, // TODO: agregar email si lo tenemos
            custom_fields: [
              // Campo "Tipo de contacto" = "Prospecto"
              {
                field_id: 859046,
                values: [{ enum_id: 714886 }] // "Prospecto"
              }
            ]
          };
          
          const contactResult = await createContact(contactData);
          
          if (contactResult && contactResult._embedded && contactResult._embedded.contacts && contactResult._embedded.contacts[0]) {
            createdContactId = contactResult._embedded.contacts[0].id;
            console.log(`✅ Contacto creado con ID: ${createdContactId}`);
          }
        } catch (contactError) {
          console.log('⚠️  Error creando contacto (continuaremos sin él):', contactError);
        }
      }
      
      // 2️⃣ Generar tags automáticos basados en el prospecto
      const autoTags = [];
      
      // Tag del producto detectado
      if (prospecto.producto_interes) {
        autoTags.push(prospecto.producto_interes.toUpperCase());
      }
      
      // Tag de urgencia
      if (prospecto.urgencia_detectada) {
        autoTags.push(prospecto.urgencia_detectada.toUpperCase());
      }
      
      // Tag de score
      if (prospecto.score_interes && prospecto.score_interes > 80) {
        autoTags.push('ALTA PRIORIDAD');
      } else if (prospecto.score_interes && prospecto.score_interes > 60) {
        autoTags.push('PRIORIDAD MEDIA');
      }
      
      // Tag de nuevo prospecto
      autoTags.push('NUEVO');
      autoTags.push('EXTERMINADOR');
      
      console.log('🏷️  Tags automáticos generados:', autoTags);
      
      // 3️⃣ Preparar notas inteligentes del prospecto
      const smartNotes = [];
      
      // Agregar resumen de IA si existe
      if (prospecto.resumen_ia) {
        smartNotes.push(`📋 RESUMEN IA:\n${prospecto.resumen_ia}`);
      }
      
      // Agregar información adicional relevante
      if (prospecto.ultima_intencion) {
        smartNotes.push(`🎯 ÚLTIMA INTENCIÓN:\n${prospecto.ultima_intencion}`);
      }
      
      if (prospecto.objeciones_detectadas && prospecto.objeciones_detectadas.length > 0) {
        smartNotes.push(`⚠️ OBJECIONES DETECTADAS:\n${prospecto.objeciones_detectadas.join(', ')}`);
      }
      
      if (prospecto.competencia_mencionada && prospecto.competencia_mencionada.length > 0) {
        smartNotes.push(`🏢 COMPETENCIA MENCIONADA:\n${prospecto.competencia_mencionada.join(', ')}`);
      }
      
      if (prospecto.momento_optimo_contacto) {
        smartNotes.push(`⏰ MOMENTO ÓPTIMO CONTACTO:\n${prospecto.momento_optimo_contacto}`);
      }
      
      if (prospecto.perfil_comunicacion) {
        smartNotes.push(`💬 PERFIL COMUNICACIÓN:\n${prospecto.perfil_comunicacion}`);
      }
      
      if (prospecto.fecha_decision_estimada) {
        smartNotes.push(`📅 FECHA DECISIÓN ESTIMADA:\n${prospecto.fecha_decision_estimada}`);
      }
      
      // Crear nota completa
      const leadNotes = [
        `🐛 PROSPECTO EXTERMINADOR - ${new Date().toLocaleString()}`,
        `📊 Score de Interés: ${prospecto.score_interes || 'N/A'}/100`,
        `📈 Probabilidad Conversión: ${prospecto.probabilidad_conversion || 'N/A'}%`,
        `🔄 Estado Embudo: ${prospecto.estado_embudo || 'N/A'}`,
        `📞 Teléfono: ${prospecto.numero_telefono || 'N/A'}`,
        '',
        ...smartNotes,
        '',
        `💡 Generado automáticamente desde el Monitor Exterminador`
      ].join('\n');
      
      console.log('📝 Notas inteligentes generadas:', leadNotes);
      
      // 4️⃣ Crear lead completo con contacto, tags y notas
      const leadData = {
        name: leadName,
        price: estimatedPrice,
        status_id: selectedStatus.id,
        pipeline_id: 10619619,
        tags: autoTags,
        contact_id: createdContactId,
        notes: leadNotes
      };
      
      console.log('=== 🚀 LEAD DATA COMPLETO A ENVIAR ===');
      console.log('Lead data completo:', JSON.stringify(leadData, null, 2));

      // 4️⃣ Intentar crear el lead con diferentes status si es necesario
      let result = null;
      let lastError = null;
      
      for (let i = 0; i < statusesToTry.length; i++) {
        const currentStatus = statusesToTry[i];
        const currentLeadData = {
          ...leadData,
          status_id: currentStatus.id
        };
        
        console.log(`\n🔄 Intento ${i + 1}/${statusesToTry.length} con status:`, {
          id: currentStatus.id,
          name: currentStatus.name
        });
        
        try {
          result = await createLead(currentLeadData);
          console.log(`✅ ¡Éxito con status "${currentStatus.name}" (ID: ${currentStatus.id})!`);
          break; // Si funciona, salir del loop
        } catch (error) {
          lastError = error;
          console.log(`❌ Falló con status "${currentStatus.name}" (ID: ${currentStatus.id}):`, error.message);
          
          // Si no es el último intento, continuar con el siguiente status
          if (i < statusesToTry.length - 1) {
            console.log('🔄 Probando con el siguiente status...');
            continue;
          }
        }
      }
      
      // Si no funcionó con ningún status
      if (!result) {
        throw new Error(`No se pudo crear el lead con ningún status. Último error: ${lastError?.message}`);
      }
      
      if (result && result._embedded && result._embedded.leads && result._embedded.leads[0]) {
        const createdLead = result._embedded.leads[0];
        console.log('✅ Lead completo creado con ID:', createdLead.id);
        
        // Mensaje de éxito detallado
        const successDetails = [
          `🎉 ¡Prospecto "${prospecto.nombre}" enviado exitosamente a Kommo!`,
          `📋 ID del Lead: ${createdLead.id}`,
          `💰 Precio: $${estimatedPrice.toLocaleString()}`,
          `📊 Status: ${selectedStatus.name}`,
          `🏷️  Tags: ${autoTags.join(', ')}`,
          ...(createdContactId ? [`👤 Contacto ID: ${createdContactId}`] : ['👤 Sin contacto asociado']),
          `📞 Teléfono: ${prospecto.numero_telefono || 'No disponible'}`,
          `📝 Notas: ${prospecto.resumen_ia ? 'Resumen IA incluido' : 'Sin resumen IA'}`
        ].join('\n');
        
        alert(successDetails);
        
        // Actualizar el prospecto para marcar que fue enviado a Kommo
        try {
          const updateNote = [
            `[${new Date().toLocaleString()}] 🚀 ENVIADO A KOMMO:`,
            `• Lead ID: ${createdLead.id}`,
            `• Precio: $${estimatedPrice.toLocaleString()}`,
            `• Status: ${selectedStatus.name}`,
            `• Tags: ${autoTags.join(', ')}`,
            ...(createdContactId ? [`• Contacto ID: ${createdContactId}`] : [])
          ].join('\n');
          
          await updateProspecto(prospecto.id, {
            ...prospecto,
            notas_ia: `${prospecto.notas_ia || ''}\n\n${updateNote}`.trim()
          });
          
          console.log('✅ Prospecto actualizado con información de Kommo');
        } catch (updateError) {
          console.log('⚠️  No se pudo actualizar el prospecto:', updateError);
        }
        
      } else {
        alert('❌ Lead creado pero sin información de respuesta completa');
      }
    } catch (error) {
      console.error('Error enviando a Kommo:', error);
      alert('Error al enviar el prospecto a Kommo. Intenta de nuevo.');
    } finally {
      setSendingToKommo(null);
    }
  };
  
  const handleEdit = (prospecto: ProspectoMkt) => {
    setEditingProspecto(prospecto);
    setShowForm(true);
  };

  const handleSetContactado = async (prospecto: ProspectoMkt) => {
    if (!prospecto.id) return;
    try {
      await updateProspecto(prospecto.id, { estado_embudo: 'contactado' });
      setActiveFilter('contactado');
    } catch (e) {
      console.error("Error al marcar como contactado:", e);
      alert("Hubo un error al actualizar el estado del prospecto.");
    }
  };

  const handleSetCliente = async (prospecto: ProspectoMkt) => {
    if (!prospecto.id) return;
    try {
      await updateProspecto(prospecto.id, { estado_embudo: 'cliente' });
      setActiveFilter('cliente');
    } catch (e) {
      console.error("Error al marcar como cliente:", e);
      alert("Hubo un error al actualizar el estado del prospecto.");
    }
  };

  const handleDelete = async (id?: number) => {
    if (id && window.confirm('¿Estás seguro de que quieres eliminar este prospecto?')) {
      await deleteProspecto(id);
      if (selectedProspecto?.id === id) {
        setSelectedProspecto(null);
      }
    }
  };
  
  const prospectStats = useMemo(() => {
    const stats: Record<string, number> = Object.keys(ESTADOS).reduce((acc, key) => ({...acc, [key]: 0 }), {});
    stats.todos = prospectos.length;
    prospectos.forEach(p => {
      if(p.estado_embudo && stats[p.estado_embudo] !== undefined) {
        stats[p.estado_embudo]++;
      } else if (p.estado_embudo === 'cita_solicitada') {
        // Contar "cita_solicitada" como "cita solicitada"
        stats['cita solicitada'] = (stats['cita solicitada'] || 0) + 1;
      }
    });
    return stats;
  }, [prospectos]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    await updateProspecto(id, { estado_embudo: newStatus });
    setActiveFilter(newStatus);
  };

  // Función para navegar a un prospecto específico por número
  const handleSelectProspectoByNumber = (numeroTelefono: string) => {
    const prospecto = prospectos.find(p => p.numero_telefono === numeroTelefono);
    if (prospecto) {
      setSelectedProspecto(prospecto);
      // Si no está visible en el filtro actual, cambiar al filtro que lo incluya
      if (!filteredProspectos.find(p => p.id === prospecto.id)) {
        setActiveFilter('todos');
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans prospectos-main-container">
      
      <ProspectoFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        prospecto={editingProspecto}
        onSave={handleSaveProspecto}
      />
      
      <aside className="w-full md:w-[280px] xl:w-[320px] md:flex-shrink-0 h-full flex flex-col border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Briefcase/> Prospectos</h1>
          <SeguimientoBar onSelectProspecto={handleSelectProspectoByNumber} />
        </div>
        
        <div className="p-4 space-y-4">
          <NeumorphicInput
              icon={<Search size={18} />}
              placeholder="Buscar prospecto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
          />
          <NeumorphicButton variant="primary" onClick={handleAddNew} className="w-full">
            <Plus size={18} /> Nuevo Prospecto
          </NeumorphicButton>
          <NeumorphicSelect
            value={selectedProducto}
            onChange={(e) => setSelectedProducto(e.target.value)}
          >
            <option value="todos">Todos los Productos</option>
            {productos.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </NeumorphicSelect>
        </div>

        <nav className="px-2 py-2 overflow-y-auto">
          {ESTADOS_SIDEBAR.map((estado) => {
              const count = prospectStats[estado] ?? 0;
              const { label, icon } = getEstadoInfo(estado);
              const isActive = activeFilter === estado;
              return (
                  <button key={estado} onClick={() => setActiveFilter(estado)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 my-0.5 rounded-lg text-sm font-medium transition-colors duration-200
                      ${isActive ? `bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300` : `hover:bg-gray-100 dark:hover:bg-gray-800`}`}>
                      <div className="flex items-center gap-3">
                          <span className={`${isActive ? '' : 'text-gray-500 dark:text-gray-400'}`}>{icon}</span>
                          <span>{label}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${isActive ? 'bg-blue-200 dark:bg-blue-900/40' : 'bg-gray-200 dark:bg-gray-700'}`}>
                          {count}
                      </span>
                  </button>
              )
          })}
        </nav>
        
        <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
            {loading ? "Actualizando..." : `Total de prospectos: ${prospectos.length}`}
        </div>
      </aside>

      <main className="flex-1 h-full p-4 md:p-8 prospectos-content-container">
        <div className="flex flex-col md:flex-row h-full">
          <div className="flex flex-col h-full w-full md:w-[400px] xl:w-[450px] md:flex-shrink-0 md:pr-2">
            <h2 className="text-lg font-semibold mb-4 capitalize flex-shrink-0">{activeFilter.replace('_', ' ')} ({filteredProspectos.length})</h2>
            <div className="overflow-y-auto space-y-3 pr-2 -mr-2 flex-1 min-h-0">
            {loading ? <p>Cargando...</p> : 
              filteredProspectos.length > 0 ? (
                filteredProspectos.map(p => (
                  <ProspectoListItem
                    key={p.id}
                    prospecto={p}
                    isSelected={selectedProspecto?.id === p.id}
                    onSelect={() => setSelectedProspecto(p)}
                  />
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">No hay prospectos que coincidan.</p>
                </div>
              )
            }
            </div>
          </div>

          <div className="flex flex-col h-full flex-1 md:pl-2 prospecto-detail-panel">
            <div className="h-full overflow-y-auto pl-4 border-l border-gray-200 dark:border-gray-700 flex flex-col prospecto-detail-container">
              <div className="prospecto-detail-content-wrapper" id="prospecto-detail-main">
                {selectedProspecto ? (
                    <ProspectoDetail 
                      prospecto={selectedProspecto} 
                      onEdit={handleEdit} 
                      onDelete={handleDelete} 
                      onSetContactado={handleSetContactado}
                      onSetCliente={handleSetCliente}
                      highlightedFields={highlightedFields[selectedProspecto.id]}
                      onStatusChange={handleStatusChange}
                      onSelectConversation={onSelectConversation}
                      hasConversation={conversations.some(c => c.numero === selectedProspecto.numero_telefono)}
                      sendingToKommo={sendingToKommo}
                      onSendToKommo={handleSendToKommo}
                    />
                ) : (
                    <WelcomePanel stats={prospectStats}/>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const ProspectoListItem: React.FC<{
  prospecto: ProspectoMkt;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ prospecto, isSelected, onSelect }) => {
  const estadoInfo = getEstadoInfo(prospecto.estado_embudo);
  const priorityInfo = getPriorityVisual(prospecto.prioridad);

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer 
      ${isSelected ? 'bg-white dark:bg-gray-800 border-blue-500 shadow-lg' : `border-transparent hover:border-gray-300 dark:hover:border-gray-600 ${estadoInfo.bgColor}`}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${estadoInfo.color} bg-opacity-20`}>
                <div className="w-5 h-5 flex items-center justify-center">{estadoInfo.icon}</div>
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">{prospecto.nombre}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{(prospecto as any).producto_interes || 'Sin producto especificado'}</p>
            </div>
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold ${priorityInfo.color}`}>
          {priorityInfo.icon}
        </div>
      </div>
      <div className="mt-3 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className={`font-mono px-2 py-0.5 rounded ${estadoInfo.color}`}>{estadoInfo.label}</span>
          </div>
          <p>Actualizado: {formatDate(prospecto.updated_at)}</p>
      </div>
    </div>
  )
}

const ProspectoDetail: React.FC<{ 
  prospecto: ProspectoMkt; 
  onEdit: (p: ProspectoMkt) => void; 
  onDelete: (id?: number) => void; 
  onSetContactado: (p: ProspectoMkt) => void;
  onSetCliente: (p: ProspectoMkt) => void;
  highlightedFields?: Set<keyof ProspectoMkt>;
  onStatusChange: (id: number, newStatus: string) => void;
  onSelectConversation: (numero: string) => void;
  hasConversation: boolean;
  sendingToKommo: string | null;
  onSendToKommo: (prospecto: ProspectoMkt) => void;
}> = ({ prospecto, onEdit, onDelete, highlightedFields, onStatusChange, onSelectConversation, hasConversation, sendingToKommo, onSendToKommo }) => {
  const [newNote, setNewNote] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Cache local del último resumen_ia conocido para mostrarlo si en DB se borra
  const [cachedResumenIA, setCachedResumenIA] = useState<string | null>(null);
  const resumenCacheKey = useMemo(() => `resumen_ia_cache_${prospecto.id}`, [prospecto.id]);

  // Cargar el resumen cacheado cuando cambia el prospecto
  useEffect(() => {
    try {
      const stored = localStorage.getItem(resumenCacheKey);
      setCachedResumenIA(stored ? stored : null);
    } catch {}
  }, [resumenCacheKey]);

  // Si llega un resumen_ia válido desde DB, actualizar cache y estado
  useEffect(() => {
    const current = (prospecto as any).resumen_ia as string | null;
    if (current && current.trim().length > 0) {
      setCachedResumenIA(current);
      try { localStorage.setItem(resumenCacheKey, current); } catch {}
    }
  }, [(prospecto as any).resumen_ia, prospecto.updated_at, resumenCacheKey]);

  useEffect(() => {
    const savedAuthor = localStorage.getItem('prospecto-note-author');
    if (savedAuthor) {
      setAuthorName(savedAuthor);
    }
  }, []);

  const handleSaveNote = async () => {
    if (newNote.trim() && authorName.trim() && prospecto) {
      setIsAddingNote(true);
      const noteToAdd: Note = { 
        content: newNote, 
        created_at: new Date().toISOString(),
        author: authorName.trim(),
      };
      
      const currentNotes = (prospecto.notas_manuales || []).map((n: any) => ({
        content: n.content,
        created_at: n.timestamp || n.created_at,
        author: n.author || 'Sistema'
      }));

      const updatedNotes = [...currentNotes, noteToAdd];
      
      try {
        const { error } = await supabase
          .from('prospectos_xt_mkt')
          .update({ notas_manuales: updatedNotes, updated_at: new Date().toISOString() })
          .eq('id', prospecto.id);

        if (error) throw error;
        
        localStorage.setItem('prospecto-note-author', authorName.trim());
        setNewNote('');
      } catch (error: any) {
        console.error('Error al guardar la nota:', error);
        alert('No se pudo guardar la nota: ' + error.message);
      } finally {
        setIsAddingNote(false);
      }
    }
  };

  // Función para agregar comentarios manuales (nueva versión)
  const handleAddComment = async (content: string, author: string): Promise<boolean> => {
    if (!content.trim() || !author.trim() || !prospecto) return false;
    
    try {
      // Obtener comentarios actuales
      const currentComments = prospecto.notas_manuales || [];
      
      // Crear nuevo comentario
      const newComment = {
        content: content.trim(),
        timestamp: new Date().toISOString(),
        author: author.trim()
      };
      
      // Agregar al inicio del array (más reciente primero)
      const updatedComments = [newComment, ...currentComments];
      
      const { error } = await supabase
        .from('prospectos_xt_mkt')
        .update({ notas_manuales: updatedComments, updated_at: new Date().toISOString() })
        .eq('id', prospecto.id);

      if (error) {
        console.error('Error saving comment:', error);
        return false;
      }

      // Actualizar localmente
      onEdit({ ...prospecto, notas_manuales: updatedComments });
      return true;
    } catch (error) {
      console.error('Error adding comment:', error);
      return false;
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (prospecto.id && newStatus) {
      onStatusChange(prospecto.id, newStatus);
    }
  };

  const isHighlighted = (field: keyof ProspectoMkt) => highlightedFields?.has(field) ?? false;

  const dropdownOptions = Object.keys(ESTADOS).filter(key => key !== 'lead');
  if (prospecto.estado_embudo && !dropdownOptions.includes(prospecto.estado_embudo)) {
    dropdownOptions.unshift(prospecto.estado_embudo);
  }

  const sentimientoEmoji = Emojis[prospecto.sentimiento_conversacion as keyof typeof Emojis] || '😐';
  
  return (
    <div className="flex-1 flex flex-col h-full prospecto-detail-content">
      {/* Header fijo */}
      <div className="flex-shrink-0 pb-4 border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h2 className={`text-2xl font-bold text-gray-900 dark:text-white truncate transition-all duration-300 ${isHighlighted('nombre') ? 'highlight-flash' : ''}`} title={prospecto.nombre ?? undefined}>
              {prospecto.nombre || 'Prospecto sin nombre'}
            </h2>
            
            <div className="mt-2">
              <NeumorphicSelect
                value={prospecto.estado_embudo || ''}
                onChange={handleStatusChange}
                className="font-semibold"
              >
                {dropdownOptions.map(estado => (
                  <option key={estado} value={estado}>
                    {getEstadoInfo(estado).label}
                  </option>
                ))}
              </NeumorphicSelect>
            </div>

          </div>
          <div className="flex items-center gap-1">
            <NeumorphicButton onClick={() => onEdit(prospecto)} variant="icon" title="Editar Prospecto">
              <Edit2 size={18} />
            </NeumorphicButton>
            {hasConversation && (
              <NeumorphicButton onClick={() => onSelectConversation(prospecto.numero_telefono!)} variant="icon" title="Ir al Chat">
                  <MessageCircle size={18} />
              </NeumorphicButton>
            )}
            <NeumorphicButton 
              onClick={() => onSendToKommo(prospecto)} 
              variant="icon" 
              className="text-blue-500" 
              title="Enviar a Kommo CRM"
              disabled={sendingToKommo === prospecto.id.toString()}
            >
              {sendingToKommo === prospecto.id.toString() ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <Building2 size={18} />
              )}
            </NeumorphicButton>
            <NeumorphicButton onClick={() => onDelete(prospecto.id)} variant='icon' className="text-red-500" title="Eliminar Prospecto"><Trash2 size={18} /></NeumorphicButton>
          </div>
        </div>
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
        <NeumorphicCard className={isHighlighted('resumen_ia') || isHighlighted('score_interes') || isHighlighted('probabilidad_conversion') || isHighlighted('sentimiento_conversacion') ? 'highlight-flash' : ''}>
        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2"><Sparkles size={20} className="text-blue-500"/> Resumen Inteligente</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 italic">
          {(prospecto.resumen_ia ?? cachedResumenIA) || "El resumen generado por IA aparecerá aquí."}
        </p>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">Score Interés</p>
                <p className={`text-xl font-bold ${getScoreColor(prospecto.score_interes)}`}>{prospecto.score_interes || 0}%</p>
            </div>
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">Prob. Conversión</p>
                <p className={`text-xl font-bold ${getScoreColor(prospecto.probabilidad_conversion)}`}>{prospecto.probabilidad_conversion || 0}%</p>
            </div>
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50">
                <p className="text-xs text-gray-500 dark:text-gray-400">Sentimiento</p>
                <p className="text-2xl">{sentimientoEmoji}</p>
            </div>
        </div>
      </NeumorphicCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <DetailItem icon={<Phone size={16}/>} label="Teléfono" value={prospecto.numero_telefono} isHighlighted={isHighlighted('numero_telefono')} />
          <DetailItem icon={<HelpCircle size={16}/>} label="Plaga a erradicar" value={(prospecto as any).plaga_a_erradicar} isHighlighted={isHighlighted('plaga_a_erradicar' as any)} />
          <DetailItem icon={<GraduationCap size={16}/>} label="Producto de interés" value={(prospecto as any).producto_interes} isHighlighted={isHighlighted('producto_interes' as any)} />
          <DetailItem icon={<Activity size={16}/>} label="Presupuesto aproximado" value={(prospecto as any).presupuesto_aproximado as any} isHighlighted={isHighlighted('presupuesto_aproximado' as any)} />
          <DetailItem icon={<FileText size={16}/>} label="Experiencia previa con plagas" value={(prospecto as any).experiencia_previa_plagas} isHighlighted={isHighlighted('experiencia_previa_plagas' as any)} />
          <DetailItem icon={<Clock size={16}/>} label="Urgencia del exterminio" value={(prospecto as any).urgencia_exterminio} isHighlighted={isHighlighted('urgencia_exterminio' as any)} />
          <SeguimientoDetailItem prospecto={prospecto} isHighlighted={isHighlighted('proximo_seguimiento')} />
          <DetailItem icon={<MessageCircle size={16}/>} label="Última Intención" value={prospecto.ultima_intencion} isHighlighted={isHighlighted('ultima_intencion')} />
      </div>

      <div className="space-y-4">
        <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2"><Tag size={16} /> Tags Automáticas</h4>
            <div className={isHighlighted('tags_automaticas') ? 'highlight-flash p-2 rounded-lg' : ''}>
              {formatTags(prospecto.tags_automaticas)}
            </div>
        </div>
        {/* Sistema de Comentarios Manuales para Asesores */}
        <ComentariosManuales
          prospecto={prospecto}
          onAddComment={handleAddComment}
          isAddingComment={isAddingNote}
        />

        <style>{`
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
        `}</style>
      </div>
      {/* Fin del contenido scrolleable */}
      </div>
    </div>
  )
}

// Componente de Varrita Orgánica de Seguimiento
const SeguimientoBar: React.FC<{ onSelectProspecto?: (numero: string) => void }> = ({ onSelectProspecto }) => {
  const { stats, loading, refresh } = useSeguimientoStats();
  const [isExpanded, setIsExpanded] = useState(false);

  const getEstadoColor = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'agendó cita': case 'agendó cita.': return 'text-green-600 dark:text-green-400';
      case 'interesado': return 'text-blue-600 dark:text-blue-400';
      case 'no_interesado': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTiempoColor = (minutos: number) => {
    if (minutos === 0) return 'text-red-600 dark:text-red-400 font-bold animate-pulse';
    if (minutos <= 30) return 'text-orange-600 dark:text-orange-400 font-semibold';
    if (minutos <= 120) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const handleIrAlProspecto = (numero: string) => {
    if (onSelectProspecto) {
      onSelectProspecto(numero);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg overflow-hidden shadow-sm seguimiento-bar">
      {/* Header Minimalista */}
      <div 
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-800/30 transition-all duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Timer size={16} className="text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Próximos seguimientos
          </span>
          {stats.proximaHora > 0 && (
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-sm">
              {stats.proximaHora}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); refresh(); }}
            className="p-1 hover:bg-blue-200/50 dark:hover:bg-blue-700/50 rounded transition-colors"
            disabled={loading}
            title="Actualizar datos"
          >
            <RefreshCw size={12} className={`text-blue-600 dark:text-blue-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {isExpanded ? 
            <ChevronUp size={16} className="text-blue-600 dark:text-blue-400" /> : 
            <ChevronDown size={16} className="text-blue-600 dark:text-blue-400" />
          }
        </div>
      </div>

      {/* Panel Expandido - Lista Orgánica */}
      {isExpanded && (
        <div className="border-t border-blue-200 dark:border-blue-700/50 animate-in slide-in-from-top-2 duration-200">
          {/* Stats Rápidas */}
          <div className="px-3 py-2 bg-white/30 dark:bg-gray-800/30">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span><strong className="text-orange-600">{stats.proximaHora}</strong> próxima hora</span>
              <span><strong className="text-green-600">{stats.activos}</strong> activos</span>
              <span><strong className="text-blue-600">{stats.programadosHoy}</strong> hoy</span>
            </div>
          </div>

          {/* Lista de Próximos Seguimientos */}
          <div className="max-h-64 overflow-y-auto">
            {stats.proximosSeguimientos.length > 0 ? (
              <div className="divide-y divide-blue-100 dark:divide-blue-800/50">
                {stats.proximosSeguimientos.map((seguimiento, index) => (
                  <div key={`${seguimiento.numero}-${index}`} className="px-3 py-2 hover:bg-blue-50/50 dark:hover:bg-blue-900/30 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {seguimiento.nombreProspecto}
                          </div>
                          <div className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
                            {seguimiento.numeroFormateado}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`text-xs font-mono ${getTiempoColor(seguimiento.tiempoRestanteMinutos)}`}>
                            {seguimiento.tiempoRestante}
                          </div>
                          <div className={`text-xs ${getEstadoColor(seguimiento.estado_embudo || '')}`}>
                            {seguimiento.estado_embudo || 'lead'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleIrAlProspecto(seguimiento.numero)}
                        className="flex-shrink-0 p-1.5 bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700 rounded-lg transition-colors group"
                        title={`Ir al prospecto ${seguimiento.nombreProspecto}`}
                      >
                        <User size={12} className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                <Timer size={20} className="mx-auto mb-2 opacity-50" />
                <div className="text-xs">No hay seguimientos próximos</div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 bg-white/30 dark:bg-gray-800/30 border-t border-blue-100 dark:border-blue-800/50">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Actualizado: {stats.ultimaActualizacion}</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>En vivo</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente minimalista para próximo seguimiento
const SeguimientoDetailItem: React.FC<{
  prospecto: ProspectoMkt;
  isHighlighted: boolean;
}> = ({ prospecto, isHighlighted }) => {
  const { stats } = useSeguimientoStats(); // Usar los mismos datos que el panel
  const [remainingMinutes, setRemainingMinutes] = useState<number | null>(null);
  const [remainingLabel, setRemainingLabel] = useState<string>('');
  const [computedFollowUp, setComputedFollowUp] = useState<Date | null>(null);
  
  const formatTiempoRestante = (minutos: number | null): string => {
    if (!minutos || minutos <= 0) return '¡Ahora!';
    
    const horas = Math.floor(minutos / 60);
    const mins = Math.floor(minutos % 60);
    
    if (horas > 0) {
      return `${horas}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
  };

  const getTiempoColor = (minutos: number | null): string => {
    if (!minutos || minutos <= 0) return 'text-red-500 dark:text-red-400 font-semibold';
    if (minutos <= 30) return 'text-orange-500 dark:text-orange-400 font-medium';
    if (minutos <= 120) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'No programado';
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // Convertir ambas fechas a la zona horaria de Tijuana para comparación precisa
      const dateTijuana = new Date(date.toLocaleString("en-US", {timeZone: "America/Tijuana"}));
      const nowTijuana = new Date(now.toLocaleString("en-US", {timeZone: "America/Tijuana"}));
      
      const today = new Date(nowTijuana.getFullYear(), nowTijuana.getMonth(), nowTijuana.getDate());
      const messageDate = new Date(dateTijuana.getFullYear(), dateTijuana.getMonth(), dateTijuana.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      // Formato de hora siempre en zona horaria de Tijuana
      const timeFormat = date.toLocaleTimeString('es-MX', {
        timeZone: 'America/Tijuana',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      // Si es hoy (en Tijuana)
      if (messageDate.getTime() === today.getTime()) {
        return `Hoy, ${timeFormat}`;
      }
      // Si es mañana (en Tijuana)
      else if (messageDate.getTime() === tomorrow.getTime()) {
        return `Mañana, ${timeFormat}`;
      }
      // Si es en los próximos 7 días
      else if (date.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000 && date > now) {
        const dayName = date.toLocaleDateString('es-MX', {
          timeZone: 'America/Tijuana',
          weekday: 'long'
        });
        return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${timeFormat}`;
      }
      // Para fechas más lejanas o pasadas
      else {
        return date.toLocaleString('es-MX', {
        timeZone: 'America/Tijuana',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
          minute: '2-digit',
          hour12: true
      });
      }
    } catch {
      return 'Fecha inválida';
    }
  };

  // Normalizador de números: comparar por últimos 10 dígitos
  const getLast10 = (num?: string | null) => (num || '').replace(/\D/g, '').slice(-10);
  // Buscar datos frescos del panel de seguimiento que coincida con este prospecto
  const seguimientoData = stats.proximosSeguimientos.find(s => 
    getLast10(s.numero) === getLast10(prospecto.numero_telefono)
  );

  // Fecha de seguimiento base (del prospecto) si existiera
  const proximoSeguimiento = prospecto.proximo_seguimiento;
  
  // Usar datos sincronizados del panel de seguimiento cuando esté disponible
  useEffect(() => {
    if (seguimientoData) {
      // Usar los datos frescos del panel de seguimiento
      setRemainingMinutes(seguimientoData.tiempoRestanteMinutos);
      setRemainingLabel(seguimientoData.tiempoRestante);
      // Reconstruir fecha objetivo basada en "ahora + minutos restantes" (zona Tijuana)
      const nowLocal = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Tijuana' }));
      const target = new Date(nowLocal.getTime() + (seguimientoData.tiempoRestanteMinutos || 0) * 60000);
      setComputedFollowUp(target);
    } else {
      // Fallback: calcular localmente si no está en el panel 4H
      const compute = () => {
        if (!proximoSeguimiento) {
          setRemainingMinutes(null);
          setRemainingLabel('');
          setComputedFollowUp(null);
          return;
        }
        const target = new Date(proximoSeguimiento);
        const now = new Date();
        const diffMin = Math.max(0, Math.round((target.getTime() - now.getTime()) / 60000));
        setRemainingMinutes(diffMin);
        setRemainingLabel(formatTiempoRestante(diffMin));
         setComputedFollowUp(target);
      };
      compute();
      const i = setInterval(compute, 60_000);
      return () => clearInterval(i);
    }
  }, [seguimientoData, proximoSeguimiento]);

  return (
    <div className={`${isHighlighted ? 'highlight-flash p-2 rounded-lg' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <Calendar size={16} className="text-gray-500 dark:text-gray-400" />
          <span className="font-medium">Próximo Seguimiento</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-900 dark:text-white font-medium">
            {formatDate(computedFollowUp ? computedFollowUp.toISOString() : proximoSeguimiento)}
          </span>
          {remainingMinutes !== null && (
            <span className={`text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 ${getTiempoColor(remainingMinutes)}`}>
              {remainingLabel}
            </span>
          )}
          {Boolean(seguimientoData) && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-semibold">
              4H
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente de Comentarios Manuales para Asesores
const ComentariosManuales: React.FC<{
  prospecto: ProspectoMkt;
  onAddComment: (content: string, author: string) => Promise<boolean>;
  isAddingComment: boolean;
}> = ({ prospecto, onAddComment, isAddingComment }) => {
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedAuthor = localStorage.getItem('prospecto-comment-author');
    if (savedAuthor) {
      setAuthorName(savedAuthor);
    }
  }, []);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !authorName.trim()) return;
    
    setIsSubmitting(true);
    const success = await onAddComment(newComment.trim(), authorName.trim());
    
    if (success) {
      setNewComment('');
      localStorage.setItem('prospecto-comment-author', authorName.trim());
    }
    
    setIsSubmitting(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmitComment();
    }
  };

  const formatearFecha = (timestamp: string) => {
    try {
      const fecha = new Date(timestamp);
      const ahora = new Date();
      const diferencia = ahora.getTime() - fecha.getTime();
      const minutos = Math.floor(diferencia / (1000 * 60));
      const horas = Math.floor(diferencia / (1000 * 60 * 60));
      const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
      
      if (minutos < 1) return 'Ahora';
      if (minutos < 60) return `Hace ${minutos}m`;
      if (horas < 24) return `Hace ${horas}h`;
      if (dias < 7) return `Hace ${dias}d`;
      
      return fecha.toLocaleDateString('es-MX', { 
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const comentarios = prospecto.notas_manuales || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <User size={18} className="text-blue-500" />
          Seguimiento de Asesores
        </h3>
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
          {comentarios.length} comentario{comentarios.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Input para nuevo comentario */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700/50 rounded-xl p-4 space-y-3">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Tu nombre como asesor..."
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="flex-shrink-0 w-40 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <div className="flex-1 relative">
            <textarea
              placeholder="Agregar comentario de seguimiento... (Ctrl+Enter para enviar)"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
              rows={2}
              disabled={isSubmitting}
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Ctrl+Enter para enviar rápido
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSubmitComment();
            }}
            disabled={!newComment.trim() || !authorName.trim() || isSubmitting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Guardando...
              </>
            ) : (
              <>
                <Plus size={16} />
                Agregar Comentario
              </>
            )}
          </button>
        </div>
      </div>

      {/* Lista de comentarios con scroll mejorado */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500 transition-all duration-300">
          {comentarios.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {comentarios.map((comentario, index) => (
                <CommentRow
                  key={`${comentario.timestamp}-${index}`}
                  index={index}
                  comentario={comentario}
                  prospectoId={prospecto.id}
                />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <MessageCircle size={40} className="mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                No hay comentarios de seguimiento aún.
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
                Sé el primero en agregar un comentario sobre este prospecto.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Fila de comentario con acciones editar/eliminar
const CommentRow: React.FC<{ index: number; comentario: any; prospectoId: number }> = ({ index, comentario, prospectoId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(comentario.content || '');

  const saveEdit = async () => {
    try {
      // Cargar notas actuales del prospecto
      const { data, error } = await supabase
        .from('prospectos_xt_mkt')
        .select('notas_manuales')
        .eq('id', prospectoId)
        .single();
      if (error) throw error;
      const arr = (data?.notas_manuales || []) as any[];
      arr[index] = { ...arr[index], content: text };
      const { error: upErr } = await supabase
        .from('prospectos_xt_mkt')
        .update({ notas_manuales: arr, updated_at: new Date().toISOString() })
        .eq('id', prospectoId);
      if (upErr) throw upErr;
      setIsEditing(false);
    } catch (e) {
      alert('No se pudo guardar la edición');
    }
  };

  const removeComment = async () => {
    if (!confirm('¿Eliminar este comentario?')) return;
    try {
      const { data, error } = await supabase
        .from('prospectos_xt_mkt')
        .select('notas_manuales')
        .eq('id', prospectoId)
        .single();
      if (error) throw error;
      const arr = (data?.notas_manuales || []) as any[];
      arr.splice(index, 1);
      const { error: upErr } = await supabase
        .from('prospectos_xt_mkt')
        .update({ notas_manuales: arr, updated_at: new Date().toISOString() })
        .eq('id', prospectoId);
      if (upErr) throw upErr;
    } catch (e) {
      alert('No se pudo eliminar el comentario');
    }
  };

  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                      <span className="text-white text-sm font-bold">
                        {(comentario.author || 'A').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {comentario.author || 'Asesor'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
              {comentario.timestamp || ''}
                        </span>
            <div className="ml-auto flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="text-xs px-2 py-1 rounded bg-amber-500 text-white" onClick={() => setIsEditing(s => !s)}>Editar</button>
              <button className="text-xs px-2 py-1 rounded bg-red-500 text-white" onClick={removeComment}>Eliminar</button>
                      </div>
                    </div>
          {isEditing ? (
            <div className="flex gap-2">
              <textarea className="flex-1 p-2 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm" rows={2} value={text} onChange={e => setText(e.target.value)} />
              <button className="px-3 py-2 text-sm rounded bg-blue-600 text-white" onClick={saveEdit}>Guardar</button>
            </div>
          ) : (
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
              {comentario.content}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const WelcomePanel: React.FC<{stats: Record<string, number>}> = ({stats}) => (
  <div className="prospecto-detail-content">
    <NeumorphicCard className="welcome-panel-card flex flex-col items-center justify-center text-center p-8">
      <Zap size={48} className="text-blue-500 mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Selecciona un Prospecto</h2>
      <p className="text-gray-600 dark:text-gray-400 mt-2">
        Elige un prospecto de la lista para ver todos sus detalles, historial y añadir comentarios.
      </p>
      <div className="flex gap-4 mt-6 text-sm text-gray-500 dark:text-gray-300">
        <span><strong className="text-blue-500">{stats.total ?? 0}</strong> Totales</span>
        <span><strong className="text-green-500">{stats.cliente ?? 0}</strong> Clientes</span>
        <span><strong className="text-amber-500">{stats.llamar_mas_tarde ?? 0}</strong> Pendientes</span>
      </div>
    </NeumorphicCard>
  </div>
);

export default ProspectosView;

const dynamicStylesId = 'prospectos-view-dynamic-styles';
if (!document.getElementById(dynamicStylesId)) {
  const style = document.createElement('style');
  style.id = dynamicStylesId;
  style.innerHTML = `
    .highlight-flash {
      animation: highlight-flash-anim 2.5s ease-out;
    }
    @keyframes highlight-flash-anim {
      0%, 100% { background-color: transparent; }
      50% { background-color: rgba(59, 130, 246, 0.15); }
    }
    
    @keyframes slide-in {
      from { 
        opacity: 0; 
        transform: translateY(10px) scale(0.98); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0) scale(1); 
      }
    }
    .animate-slide-in {
      animation: slide-in 0.4s ease-out forwards;
    }
    
    /* Efecto de hover sutil para los comentarios */
    .comment-item:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }

    /* Scrollbar personalizada para el historial */
    .scrollbar-thin::-webkit-scrollbar {
      width: 6px;
    }
    .scrollbar-thin::-webkit-scrollbar-track {
      background: transparent;
    }
    .scrollbar-thin::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 3px;
    }
    .scrollbar-thin::-webkit-scrollbar-thumb:hover {
      background-color: rgba(0, 0, 0, 0.3);
    }
    .dark .scrollbar-thin::-webkit-scrollbar-thumb {
      background-color: rgba(255, 255, 255, 0.2);
    }
    .dark .scrollbar-thin::-webkit-scrollbar-thumb:hover {
      background-color: rgba(255, 255, 255, 0.3);
    }
  `;
  document.head.appendChild(style);
}
