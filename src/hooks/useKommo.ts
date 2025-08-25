import { useState, useEffect, useCallback } from 'react';

// Tipos para la API de Kommo
export interface KommoLead {
  id: number;
  name: string;
  price: number;
  responsible_user_id: number;
  group_id: number;
  status_id: number;
  pipeline_id: number;
  loss_reason_id?: number;
  created_by: number;
  updated_by: number;
  created_at: number;
  updated_at: number;
  closed_at?: number;
  closest_task_at?: number;
  is_deleted: boolean;
  custom_fields_values?: any[];
  score?: number;
  account_id: number;
  labor_cost?: number;
  _links: {
    self: {
      href: string;
    };
  };
  _embedded?: {
    tags?: any[];
    companies?: any[];
    contacts?: any[];
  };
}

export interface KommoPipeline {
  id: number;
  name: string;
  sort: number;
  is_main: boolean;
  is_unsorted_on: boolean;
  is_archive: boolean;
  account_id: number;
  _links: {
    self: {
      href: string;
    };
  };
  _embedded: {
    statuses: KommoStatus[];
  };
}

export interface KommoStatus {
  id: number;
  name: string;
  sort: number;
  is_editable: boolean;
  pipeline_id: number;
  color: string;
  type: number;
  account_id: number;
  _links: {
    self: {
      href: string;
    };
  };
}

export interface KommoStats {
  totalLeads: number;
  totalValue: number;
  averageValue: number;
  conversionRate: number;
  leadsPerStatus: { [statusId: number]: number };
  valuePerStatus: { [statusId: number]: number };
}

// Usar proxy local en desarrollo, función de Netlify en producción
const KOMMO_BASE_URL = import.meta.env.DEV 
  ? '/api/kommo' 
  : '/.netlify/functions/kommo-proxy';

// Token desde variables de entorno
const KOMMO_ACCESS_TOKEN = import.meta.env.VITE_KOMMO_ACCESS_TOKEN || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6Ijc3OGYwZWYzOTA1Mjc3ZTliMDY4NzdkMDVmNTZiOTVlN2QzMDEwNDQ1OWY1ODdhZmViN2JmZDUxNGMyNmRhYjNmZTc3ZmI1NjIwYTAzYTE5In0.eyJhdWQiOiJhNzY5ZTgyNy1kOTgzLTQzZmUtOGI5Yi04YzFlN2E0ZDg0OWYiLCJqdGkiOiI3NzhmMGVmMzkwNTI3N2U5YjA2ODc3ZDA1ZjU2Yjk1ZTdkMzAxMDQ0NTlmNTg3YWZlYjdiZmQ1MTRjMjZkYWIzZmU3N2ZiNTYyMGEwM2ExOSIsImlhdCI6MTc1NTg4Njg5NSwibmJmIjoxNzU1ODg2ODk1LCJleHAiOjE3NTU5NzMyOTUsInN1YiI6IjExMjI3MTQzIiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjM0MjMzNTA3LCJiYXNlX2RvbWFpbiI6ImtvbW1vLmNvbSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJwdXNoX25vdGlmaWNhdGlvbnMiLCJmaWxlcyIsImNybSIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiXSwidXNlcl9mbGFncyI6MCwiaGFzaF91dWlkIjoiNzY5YWQ3YjUtMGZjNy00Nzg2LTg1YWUtZTcxOTQ0NzE2ZmY3IiwiYXBpX2RvbWFpbiI6ImFwaS1jLmtvbW1vLmNvbSJ9.E5VMWm7VcDFaASIzSnUAGDyqBseGcTzMpHWXyYG0VL9UmyLiDJELs323IEJLoh8L8hDPg25Nzxbxfbx1bafxGqw-NTNqop15-PPlEVTi8-vBrDGa_FSAhjVpXAb0wfaBVy4Y6R-Vf8CghMoyEVNa9owwokZ8hw9sIsryv0yiEoH_UfMAMfteCkuWq3P8Sizr0dkqupr3zZ5no38OAautbv2-c65cYJ_TcFlhqvgMtXXF7E3KX2OT3fTybpxZqrl41csR23gpvmtlCAe4F62v0FXIoYqtQ-ioSbjh4i-8uvM-UA0nZRcoy_2akqWS3aBUc8j85y7GzDGvUJaxDlbpFw';

// Pipeline específico de Mayo Dental
const MAYO_DENTAL_PIPELINE_ID = 10619619;

// Debug de configuración
console.log(`[useKommo] Entorno: ${import.meta.env.DEV ? 'DESARROLLO' : 'PRODUCCIÓN'}`);
console.log(`[useKommo] Base URL: ${KOMMO_BASE_URL}`);
console.log(`[useKommo] Token disponible: ${KOMMO_ACCESS_TOKEN ? 'Sí' : 'No'}`);

// Datos de demostración
const DEMO_DATA = {
  pipelines: [
    {
      id: 1,
      name: "Pipeline Principal - Mayo Dental",
      sort: 1,
      is_main: true,
      is_unsorted_on: false,
      is_archive: false,
      account_id: 34233507,
      _links: { self: { href: "/api/v4/leads/pipelines/1" } },
      _embedded: {
        statuses: [
          { id: 101, name: "Contacto Inicial", sort: 1, is_editable: true, pipeline_id: 1, color: "#99ccfd", type: 1, account_id: 34233507, _links: { self: { href: "/api/v4/leads/pipelines/1/statuses/101" } } },
          { id: 102, name: "Consulta Programada", sort: 2, is_editable: true, pipeline_id: 1, color: "#fffd99", type: 1, account_id: 34233507, _links: { self: { href: "/api/v4/leads/pipelines/1/statuses/102" } } },
          { id: 103, name: "Diagnóstico Realizado", sort: 3, is_editable: true, pipeline_id: 1, color: "#fd99cc", type: 1, account_id: 34233507, _links: { self: { href: "/api/v4/leads/pipelines/1/statuses/103" } } },
          { id: 104, name: "Presupuesto Enviado", sort: 4, is_editable: true, pipeline_id: 1, color: "#99fdcc", type: 1, account_id: 34233507, _links: { self: { href: "/api/v4/leads/pipelines/1/statuses/104" } } },
          { id: 105, name: "Tratamiento Iniciado", sort: 5, is_editable: true, pipeline_id: 1, color: "#ccfd99", type: 1, account_id: 34233507, _links: { self: { href: "/api/v4/leads/pipelines/1/statuses/105" } } },
          { id: 106, name: "Cerrado Exitoso", sort: 6, is_editable: false, pipeline_id: 1, color: "#99fd99", type: 2, account_id: 34233507, _links: { self: { href: "/api/v4/leads/pipelines/1/statuses/106" } } }
        ]
      }
    }
  ],
  leads: [
    { id: 1001, name: "María González - Ortodoncia", price: 25000, responsible_user_id: 11227143, group_id: 0, status_id: 101, pipeline_id: 1, created_by: 11227143, updated_by: 11227143, created_at: 1705776000, updated_at: 1705862400, is_deleted: false, account_id: 34233507, _links: { self: { href: "/api/v4/leads/1001" } } },
    { id: 1002, name: "Carlos Rodríguez - Implante", price: 35000, responsible_user_id: 11227143, group_id: 0, status_id: 102, pipeline_id: 1, created_by: 11227143, updated_by: 11227143, created_at: 1705689600, updated_at: 1705776000, is_deleted: false, account_id: 34233507, _links: { self: { href: "/api/v4/leads/1002" } } },
    { id: 1003, name: "Ana López - Blanqueamiento", price: 8000, responsible_user_id: 11227143, group_id: 0, status_id: 103, pipeline_id: 1, created_by: 11227143, updated_by: 11227143, created_at: 1705603200, updated_at: 1705689600, is_deleted: false, account_id: 34233507, _links: { self: { href: "/api/v4/leads/1003" } } },
    { id: 1004, name: "Roberto Martínez - Prótesis", price: 45000, responsible_user_id: 11227143, group_id: 0, status_id: 104, pipeline_id: 1, created_by: 11227143, updated_by: 11227143, created_at: 1705516800, updated_at: 1705603200, is_deleted: false, account_id: 34233507, _links: { self: { href: "/api/v4/leads/1004" } } },
    { id: 1005, name: "Elena Fernández - Endodoncia", price: 15000, responsible_user_id: 11227143, group_id: 0, status_id: 105, pipeline_id: 1, created_by: 11227143, updated_by: 11227143, created_at: 1705430400, updated_at: 1705516800, is_deleted: false, account_id: 34233507, _links: { self: { href: "/api/v4/leads/1005" } } },
    { id: 1006, name: "José García - Limpieza", price: 3000, responsible_user_id: 11227143, group_id: 0, status_id: 106, pipeline_id: 1, created_by: 11227143, updated_by: 11227143, created_at: 1705344000, updated_at: 1705430400, closed_at: 1705430400, is_deleted: false, account_id: 34233507, _links: { self: { href: "/api/v4/leads/1006" } } },
    { id: 1007, name: "Patricia Sánchez - Ortodoncia", price: 28000, responsible_user_id: 11227143, group_id: 0, status_id: 101, pipeline_id: 1, created_by: 11227143, updated_by: 11227143, created_at: 1705257600, updated_at: 1705344000, is_deleted: false, account_id: 34233507, _links: { self: { href: "/api/v4/leads/1007" } } },
    { id: 1008, name: "Miguel Torres - Implante Múltiple", price: 65000, responsible_user_id: 11227143, group_id: 0, status_id: 102, pipeline_id: 1, created_by: 11227143, updated_by: 11227143, created_at: 1705171200, updated_at: 1705257600, is_deleted: false, account_id: 34233507, _links: { self: { href: "/api/v4/leads/1008" } } }
  ]
};

export const useKommo = () => {
  const [leads, setLeads] = useState<KommoLead[]>([]);
  const [pipelines, setPipelines] = useState<KommoPipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<KommoStats | null>(null);
  const [useDemoData, setUseDemoData] = useState(false);

  // Función para hacer peticiones a la API de Kommo
  const kommoRequest = useCallback(async (endpoint: string, method: string = 'GET', body?: any) => {
    try {
      console.log(`Intentando conectar ${method} a:`, `${KOMMO_BASE_URL}${endpoint}`);
      console.log('Token disponible:', KOMMO_ACCESS_TOKEN ? 'Sí' : 'No');
      
      const config: RequestInit = {
        method,
        headers: {
          'Authorization': `Bearer ${KOMMO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors'
      };

      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.body = JSON.stringify(body);
        console.log('Body enviado:', body);
      }

      const response = await fetch(`${KOMMO_BASE_URL}${endpoint}`, config);

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Error ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Data received:', data);
      return data;
    } catch (err) {
      console.error('Error en petición a Kommo:', err);
      throw err;
    }
  }, []);

  // Calcular estadísticas
  const calculateStats = useCallback((leadsData: KommoLead[]) => {
    const totalLeads = leadsData.length;
    const totalValue = leadsData.reduce((sum, lead) => sum + (lead.price || 0), 0);
    const averageValue = totalLeads > 0 ? totalValue / totalLeads : 0;
    
    // Contar leads por status
    const leadsPerStatus: { [statusId: number]: number } = {};
    const valuePerStatus: { [statusId: number]: number } = {};
    
    leadsData.forEach(lead => {
      const statusId = lead.status_id;
      leadsPerStatus[statusId] = (leadsPerStatus[statusId] || 0) + 1;
      valuePerStatus[statusId] = (valuePerStatus[statusId] || 0) + (lead.price || 0);
    });

    // Calcular tasa de conversión (leads cerrados exitosamente vs total)
    const closedSuccessfullyCount = leadsData.filter(lead => {
      return lead.closed_at && lead.price > 0;
    }).length;
    
    const conversionRate = totalLeads > 0 ? (closedSuccessfullyCount / totalLeads) * 100 : 0;

    setStats({
      totalLeads,
      totalValue,
      averageValue,
      conversionRate,
      leadsPerStatus,
      valuePerStatus
    });
  }, []);

  // Cargar datos de demostración
  const loadDemoData = useCallback(() => {
    console.log('Cargando datos de demostración...');
    setPipelines(DEMO_DATA.pipelines as KommoPipeline[]);
    setLeads(DEMO_DATA.leads as KommoLead[]);
    calculateStats(DEMO_DATA.leads as KommoLead[]);
    setUseDemoData(true);
    setError('Usando datos de demostración - Conexión con Kommo no disponible');
  }, [calculateStats]);

  // Cargar pipelines (embudos)
  const fetchPipelines = useCallback(async () => {
    try {
      const data = await kommoRequest('/leads/pipelines');
      if (data._embedded && data._embedded.pipelines) {
        setPipelines(data._embedded.pipelines);
        setUseDemoData(false);
      }
    } catch (err) {
      console.error('Error cargando pipelines:', err);
      console.log('Fallback a datos de demostración...');
      loadDemoData();
    }
  }, [kommoRequest, loadDemoData]);

  // Cargar todos los leads del pipeline específico de Mayo Dental con paginación
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Obteniendo TODOS los leads del pipeline Mayo Dental...');
      
      let allLeads: KommoLead[] = [];
      let page = 1;
      let hasMorePages = true;
      const limit = 250; // Límite máximo por página de Kommo
      
      while (hasMorePages) {
        console.log(`Cargando página ${page}...`);
        
        const data = await kommoRequest(
          `/leads?with=contacts&limit=${limit}&page=${page}&filter[pipeline_id]=${MAYO_DENTAL_PIPELINE_ID}`
        );
        
        if (data._embedded && data._embedded.leads && data._embedded.leads.length > 0) {
          allLeads = [...allLeads, ...data._embedded.leads];
          console.log(`Página ${page}: ${data._embedded.leads.length} leads. Total acumulado: ${allLeads.length}`);
          
          // Verificar si hay más páginas
          hasMorePages = data._embedded.leads.length === limit;
          page++;
        } else {
          hasMorePages = false;
        }
        
        // Seguridad: evitar bucle infinito
        if (page > 20) {
          console.warn('Alcanzado límite de seguridad de 20 páginas');
          break;
        }
      }
      
      console.log(`✅ TOTAL de leads obtenidos: ${allLeads.length}`);
      setLeads(allLeads);
      calculateStats(allLeads);
      setUseDemoData(false);
      setError(null);
      
    } catch (err) {
      console.error('Error cargando leads:', err);
      console.log('Fallback a datos de demostración...');
      if (!useDemoData) {
        loadDemoData();
      }
    } finally {
      setLoading(false);
    }
  }, [kommoRequest, useDemoData, loadDemoData, calculateStats]);

  // Obtener información de un status específico
  const getStatusInfo = useCallback((statusId: number) => {
    for (const pipeline of pipelines) {
      const status = pipeline._embedded.statuses.find(s => s.id === statusId);
      if (status) {
        return {
          ...status,
          pipelineName: pipeline.name
        };
      }
    }
    return null;
  }, [pipelines]);

  // Obtener leads por status
  const getLeadsByStatus = useCallback((statusId: number) => {
    return leads.filter(lead => lead.status_id === statusId);
  }, [leads]);

  // Crear un contacto en Kommo
  const createContact = useCallback(async (contactData: {
    name: string;
    phone?: string;
    email?: string;
    custom_fields?: any[];
  }) => {
    try {
      console.log('Creando contacto en Kommo...', contactData);
      
      const customFields = [];
      
      // Agregar teléfono si está disponible
      if (contactData.phone) {
        customFields.push({
          field_id: 746980, // ID del campo teléfono en Kommo (puede necesitar ajuste)
          values: [{
            value: contactData.phone,
            enum_id: 619896 // "Teléfono Oficina"
          }]
        });
      }
      
      // Agregar email si está disponible
      if (contactData.email) {
        customFields.push({
          field_id: 746982, // ID del campo email en Kommo
          values: [{
            value: contactData.email,
            enum_id: 619908 // "Correo"
          }]
        });
      }
      
      // Agregar campos personalizados adicionales
      if (contactData.custom_fields) {
        customFields.push(...contactData.custom_fields);
      }
      
      const payload = [{
        name: contactData.name,
        custom_fields_values: customFields
      }];
      
      console.log('Payload contacto:', JSON.stringify(payload, null, 2));
      
      const response = await kommoRequest('/contacts', 'POST', payload);
      console.log('✅ Contacto creado exitosamente:', response);
      
      // Verificar si la respuesta tiene la estructura esperada
      if (response && response._embedded && response._embedded.contacts && response._embedded.contacts[0]) {
        console.log('✅ Estructura de respuesta correcta, contacto ID:', response._embedded.contacts[0].id);
      } else {
        console.log('⚠️ Estructura de respuesta inesperada:', response);
      }
      
      return response;
    } catch (err) {
      console.error('Error creando contacto:', err);
      throw err;
    }
  }, [kommoRequest]);

  // Crear una nota para un lead específico
  const createNoteForLead = useCallback(async (leadId: number, noteText: string) => {
    try {
      console.log('Creando nota para lead ID:', leadId);
      
      const notePayload = [{
        entity_id: leadId,
        entity_type: 'leads',
        note_type: 'common',
        params: {
          text: noteText
        }
      }];
      
      console.log('Payload nota:', JSON.stringify(notePayload, null, 2));
      
      // Probar diferentes estrategias para agregar notas
      let response = null;
      
      // ESTRATEGIA 1: Usar endpoint /events (actividades)
      try {
        console.log('🔄 Probando crear actividad/evento...');
        const eventPayload = [{
          entity_id: leadId,
          entity_type: 'leads',
          note_type: 'common',
          params: {
            text: noteText
          }
        }];
        
        response = await kommoRequest('/events', 'POST', eventPayload);
        console.log('✅ Nota creada como evento exitosamente');
      } catch (eventError) {
        console.log('❌ Falló crear evento:', eventError.message);
        
        // ESTRATEGIA 2: Actualizar el lead con descripción
        try {
          console.log('🔄 Probando actualizar lead con descripción...');
          const updatePayload = {
            id: leadId,
            custom_fields_values: [
              {
                field_id: 1, // Campo estándar de descripción
                values: [{ value: noteText }]
              }
            ]
          };
          
          response = await kommoRequest(`/leads/${leadId}`, 'PATCH', updatePayload);
          console.log('✅ Lead actualizado con descripción');
        } catch (updateError) {
          console.log('❌ Falló actualizar lead:', updateError.message);
          
          // ESTRATEGIA 3: Crear tarea/recordatorio
          try {
            console.log('🔄 Probando crear tarea...');
            const taskPayload = [{
              entity_id: leadId,
              entity_type: 'leads',
              text: `📝 Notas del prospecto: ${noteText}`,
              complete_till: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 días
              task_type_id: 1
            }];
            
            response = await kommoRequest('/tasks', 'POST', taskPayload);
            console.log('✅ Tarea creada exitosamente');
          } catch (taskError) {
            console.log('❌ Falló crear tarea:', taskError.message);
            console.log('⚠️ No se pudieron agregar notas, pero el lead fue creado exitosamente');
          }
        }
      }
      console.log('✅ Nota creada exitosamente:', response);
      
      return response;
    } catch (err) {
      console.error('Error creando nota:', err);
      throw err;
    }
  }, [kommoRequest]);

  // Crear un nuevo lead en Kommo
  const createLead = useCallback(async (leadData: {
    name: string;
    price?: number;
    status_id: number;
    pipeline_id: number;
    tags?: string[];
    contact_id?: number;
    notes?: string;
  }) => {
    try {
      console.log('Creando nuevo lead en Kommo...', leadData);
      
      // Payload completo según la documentación de Kommo
      const embeddedData: any = {};
      
      // Agregar tags si están disponibles
      if (leadData.tags && leadData.tags.length > 0) {
        embeddedData.tags = leadData.tags.map(tag => ({ name: tag }));
      }
      
      // Agregar contacto si está disponible
      if (leadData.contact_id) {
        embeddedData.contacts = [{ id: leadData.contact_id }];
      }
      
      const payload = [{
        name: leadData.name,
        price: leadData.price || 0,
        status_id: leadData.status_id,
        pipeline_id: leadData.pipeline_id,
        // Solo agregar _embedded si tiene contenido
        ...(Object.keys(embeddedData).length > 0 && { _embedded: embeddedData })
      }];
      
      console.log('Payload enviado a Kommo:', JSON.stringify(payload, null, 2));
      
      const response = await kommoRequest('/leads', 'POST', payload);
      console.log('Lead creado exitosamente:', response);
      
                // Si hay notas, intentar crearlas como nota separada después del lead
          if (leadData.notes && response && response._embedded && response._embedded.leads && response._embedded.leads[0]) {
            const createdLeadId = response._embedded.leads[0].id;
            try {
              console.log('📝 Intentando agregar notas al lead...', createdLeadId);
              await createNoteForLead(createdLeadId, leadData.notes);
            } catch (noteError) {
              console.log('⚠️  Las notas no se pudieron agregar automáticamente, pero el lead fue creado exitosamente');
              console.log('💡 Las notas se pueden agregar manualmente en Kommo:', leadData.notes);
            }
          }
      
      // Refrescar los leads después de crear uno nuevo
      await fetchLeads();
      
      return response;
    } catch (err) {
      console.error('Error creando lead:', err);
      throw err;
    }
  }, [kommoRequest, fetchLeads, createNoteForLead]);

  // Refrescar datos
  const refresh = useCallback(async () => {
    setError(null);
    await Promise.all([fetchPipelines(), fetchLeads()]);
  }, [fetchPipelines, fetchLeads]);

  // Cargar datos inicialmente
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    leads,
    pipelines,
    loading,
    error,
    stats,
    getStatusInfo,
    getLeadsByStatus,
    refresh,
    createLead,
    createContact,
    createNoteForLead
  };
};

export default useKommo;
