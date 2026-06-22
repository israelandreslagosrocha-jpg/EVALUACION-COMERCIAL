<template>
  <div class="app-container">
    <!-- BARRA DE NAVEGACIÓN Y STATUS DE CONEXIÓN -->
    <header class="app-header animate-fade-in">
      <div class="header-logo-title">
        <div class="logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        </div>
        <div>
          <h1>GESTOR DE TASACIONES</h1>
          <p class="tagline">Plataforma Técnica de Evaluación Comercial Inmobiliaria</p>
        </div>
      </div>
      
      <!-- Nav tabs -->
      <nav class="nav-tabs">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'nueva' }" 
          @click="activeTab = 'nueva'"
        >
          📝 Nueva Tasación
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'historial' }" 
          @click="activeTab = 'historial'"
        >
          📂 Historial Guardado
        </button>
      </nav>

      <!-- Status de Supabase -->
      <div class="connection-status-badge" :class="{ connected: isConnected }">
        <span class="status-dot"></span>
        <span class="status-text">{{ isConnected ? 'Supabase Conectado' : 'Almacenamiento Local (Offline)' }}</span>
      </div>
    </header>

    <main class="main-content">
      <!-- TOAST NOTIFICATION -->
      <div class="toast-message animate-fade-in" v-if="toastMsg" :class="toastType">
        {{ toastMsg }}
      </div>

      <!-- VISTA NUEVA TASACIÓN -->
      <div v-show="activeTab === 'nueva'" class="app-layout">
        <!-- 1. Cliente y Propiedad -->
        <ClientPropertyForm v-model="formData" />

        <!-- 2. Comparables de Mercado -->
        <ComparablesManager 
          :comparables="comparables" 
          @apply-terrain-value="handleApplyTerrainValue" 
          @recalculate="triggerAppraisalRecalc"
        />

        <!-- 3. Obras Complementarias -->
        <ObrasComplementarias 
          :works="works" 
          @recalculate="triggerAppraisalRecalc"
        />

        <!-- 4. Notas y Recomendación -->
        <div class="panel card animate-fade-in">
          <h3>4. Consideraciones y Recomendación Final</h3>
          <div class="form-group mb-3">
            <label>Agente Tasador / Visador</label>
            <input type="text" class="form-input" v-model="agentName" placeholder="Ej: Ximena Torres" />
          </div>
          <div class="form-group mb-3">
            <label>Comentarios y Consideraciones Técnicas</label>
            <textarea 
              class="form-input" 
              rows="4" 
              v-model="comment" 
              placeholder="Indique las condiciones del mercado, variabilidad de precios del sector, tiempo estimado de venta, etc..."
            ></textarea>
          </div>
          <div class="form-group">
            <label>Recomendación Comercial Directa</label>
            <textarea 
              class="form-input warning-input" 
              rows="3" 
              v-model="recommendation" 
              placeholder="Se recomienda promover venta a un valor probable de... para aceptar ofertas de..."
            ></textarea>
          </div>
        </div>

        <!-- 5. Resultados de Tasación en Tiempo Real -->
        <DashboardResults :results="calculatedResults" />

        <!-- 6. Memoria de Cálculo / Trazabilidad -->
        <TrazabilidadPanel :trace="calculatedResults.trace" />

        <!-- 7. Barra de Acciones del Proyecto -->
        <div class="appraisal-actions card animate-fade-in">
          <div class="actions-flex">
            <button class="btn btn-primary" @click="saveTasacion" :disabled="saving">
              {{ saving ? 'Guardando...' : '💾 Guardar Tasación' }}
            </button>
            <button class="btn btn-secondary" @click="handleExportPdf">
              📄 Exportar PDF
            </button>
            <button class="btn btn-secondary" @click="handleExportExcel">
              📊 Exportar Excel
            </button>
            <button class="btn btn-clear" @click="resetAll">
              🧹 Limpiar Formulario
            </button>
          </div>
        </div>
      </div>

      <!-- VISTA HISTORIAL -->
      <div v-if="activeTab === 'historial'">
        <HistoryManager @load="handleLoadEvaluation" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import ClientPropertyForm from './components/ClientPropertyForm.vue';
import ComparablesManager from './components/ComparablesManager.vue';
import ObrasComplementarias from './components/ObrasComplementarias.vue';
import DashboardResults from './components/DashboardResults.vue';
import TrazabilidadPanel from './components/TrazabilidadPanel.vue';
import HistoryManager from './components/HistoryManager.vue';

import { calculateAppraisal } from './logic/calculations.js';
import { isSupabaseConnected, dbAddCliente, dbUpdateCliente, dbAddPropiedad, dbUpdatePropiedad, dbAddEvaluacion, dbUpdateEvaluacion } from './utils/supabase.js';
import { exportToPDF, exportToExcel } from './utils/export.js';

// Tabs
const activeTab = ref('nueva');
const isConnected = ref(false);

// Inputs reactivos principales
const formData = reactive({
  client: {
    id: '',
    nombre: '',
    rut: '',
    telefono: '',
    email: '',
    direccion: '',
    observaciones: ''
  },
  property: {
    id: '',
    direccion: '',
    comuna: '',
    rol_sii: '',
    superficie_terreno: 250,
    superficie_construida: 120,
    clase_construccion: 'C',
    calidad_construccion: 3,
    antiguedad_real: 15,
    antiguedad_aparente: 15,
    observaciones: ''
  },
  valorUfTerreno: 0,
  valorBaseConstruccionOverride: null,
  valorUF: 39400
});

const comparables = ref([]);
const works = ref([]);
const comment = ref('');
const recommendation = ref('');
const agentName = ref('Ximena Torres');
const activeEvaluationId = ref('');

// Estado de UI
const saving = ref(false);
const toastMsg = ref('');
const toastType = ref('');

// Cargar estado inicial y conexión
onMounted(async () => {
  isConnected.value = isSupabaseConnected();
  await loadUF();
  resetAll(); // Cargar formulario con datos iniciales
});

const loadUF = async () => {
  try {
    const response = await fetch('https://mindicador.cl/api/uf');
    if (response.ok) {
      const data = await response.json();
      if (data && data.serie && data.serie.length > 0) {
        formData.valorUF = Math.round(data.serie[0].valor);
      }
    }
  } catch (error) {
    console.error('Error al consultar UF diaria, usando fallback:', error);
  }
};

// Limpia el formulario completo para una nueva tasación
const resetAll = () => {
  formData.client = { id: '', nombre: '', rut: '', telefono: '', email: '', direccion: '', observaciones: '' };
  formData.property = { id: '', direccion: '', comuna: '', rol_sii: '', superficie_terreno: 200, superficie_construida: 100, clase_construccion: 'C', calidad_construccion: 3, antiguedad_real: 20, antiguedad_aparente: 20, observaciones: '' };
  formData.valorUfTerreno = 0;
  formData.valorBaseConstruccionOverride = null;
  
  comparables.value = [];
  works.value = [];
  comment.value = '';
  recommendation.value = '';
  activeEvaluationId.value = '';
  
  // Agregar comparables semilla para demostración
  addSeeds();
  showToast('Formulario restablecido. Listo para nueva tasación.', 'info');
};

const addSeeds = () => {
  comparables.value = [
    {
      id: 's-1',
      portal_origen: 'Portal Inmobiliario',
      fecha_captura: '2026-04-14',
      precio_publicacion: 5610,
      uf: formData.valorUF,
      superficie_terreno: 311,
      superficie_construida: 130,
      clase: 'C',
      calidad: 3,
      antiguedad: 70,
      direccion: 'Calle Castelar, cerro Barón',
      comuna: 'Valparaíso',
      peso: 2
    },
    {
      id: 's-2',
      portal_origen: 'TOCTOC',
      fecha_captura: '2026-04-14',
      precio_publicacion: 6512,
      uf: formData.valorUF,
      superficie_terreno: 321,
      superficie_construida: 133,
      clase: 'E',
      calidad: 3,
      antiguedad: 70,
      direccion: 'Bellavista Juan Urzua',
      comuna: 'Valparaíso',
      peso: 2
    },
    {
      id: 's-3',
      portal_origen: 'Portal Inmobiliario',
      fecha_captura: '2026-04-14',
      precio_publicacion: 4894,
      uf: formData.valorUF,
      superficie_terreno: 160,
      superficie_construida: 150,
      clase: 'C',
      calidad: 3,
      antiguedad: 70,
      direccion: 'Cerro Ramaditas',
      comuna: 'Valparaíso',
      peso: 2
    }
  ];
};

// Calcula los resultados finales en tiempo real
const calculatedResults = computed(() => {
  const inputs = {
    m2Terreno: formData.property.superficie_terreno,
    m2Construido: formData.property.superficie_construida,
    claseConstruccion: formData.property.clase_construccion,
    calidadConstruccion: formData.property.calidad_construccion,
    antiguedad: formData.property.antiguedad_aparente, // Usamos antigüedad aparente por Chornik
    valorUF: formData.valorUF,
    valorUfTerreno: formData.valorUfTerreno,
    valorBaseConstruccionOverride: formData.valorBaseConstruccionOverride
  };
  
  return calculateAppraisal(inputs, comparables.value, works.value);
});

// Forzar actualización si cambia un comparable
const triggerAppraisalRecalc = () => {
  // Computed recalcula automáticamente al cambiar comparables.value o works.value
};

const handleApplyTerrainValue = (val) => {
  formData.valorUfTerreno = val;
  showToast(`Suelo aplicado: ${val} UF/m²`, 'success');
};

const showToast = (msg, type = 'info') => {
  toastMsg.value = msg;
  toastType.value = type;
  setTimeout(() => {
    toastMsg.value = '';
  }, 4000);
};

/* --- PERSISTENCIA: GUARDAR TASACIÓN --- */

const saveTasacion = async () => {
  if (!formData.client.nombre || !formData.property.direccion || !formData.property.comuna) {
    showToast('Error: Completa el nombre del cliente y dirección/comuna de la propiedad.', 'error');
    return;
  }

  saving.value = true;
  try {
    let clientObj = { ...formData.client };
    let propertyObj = { ...formData.property };
    
    // 1. Guardar o actualizar Cliente
    if (clientObj.id) {
      await dbUpdateCliente(clientObj.id, clientObj);
    } else {
      const added = await dbAddCliente(clientObj);
      formData.client.id = added.id;
      clientObj.id = added.id;
    }

    // 2. Guardar o actualizar Propiedad
    if (propertyObj.id) {
      await dbUpdatePropiedad(propertyObj.id, propertyObj);
    } else {
      const added = await dbAddPropiedad(propertyObj);
      formData.property.id = added.id;
      propertyObj.id = added.id;
    }

    // 3. Preparar JSONs
    const evalData = {
      cliente_id: clientObj.id,
      propiedad_id: propertyObj.id,
      fecha: new Date().toISOString().split('T')[0],
      agente: agentName.value,
      valor_uf_dia: formData.valorUF,
      comentarios: comment.value,
      recomendacion: recommendation.value,
      obras_complementarias: works.value,
      comparables_utilizados: comparables.value,
      resultado_tasacion: {
        valorUfTerreno: calculatedResults.value.valorUfTerreno,
        constDepreciadaUFm2: calculatedResults.value.constDepreciadaUFm2,
        totalTerrenoUF: calculatedResults.value.totalTerrenoUF,
        totalConstruccionUF: calculatedResults.value.totalConstruccionUF,
        totalObrasUF: calculatedResults.value.totalObrasUF,
        totalTasacionUF: calculatedResults.value.totalTasacionUF,
        valorMinimoUF: calculatedResults.value.valorMinimoUF,
        valorProbableUF: calculatedResults.value.valorProbableUF,
        valorMaximoUF: calculatedResults.value.valorMaximoUF,
        valorProbableCLP: calculatedResults.value.valorProbableCLP
      }
    };

    // 4. Guardar o actualizar Evaluación
    if (activeEvaluationId.value) {
      await dbUpdateEvaluacion(activeEvaluationId.value, evalData);
      showToast('¡Tasación actualizada con éxito!', 'success');
    } else {
      const added = await dbAddEvaluacion(evalData);
      activeEvaluationId.value = added.id;
      showToast('¡Tasación guardada en el historial con éxito!', 'success');
    }

  } catch (error) {
    console.error("Error al guardar tasación:", error);
    showToast('Hubo un problema al guardar la tasación.', 'error');
  } finally {
    saving.value = false;
  }
};

/* --- CARGAR TASACIÓN DEL HISTORIAL --- */

const handleLoadEvaluation = (ev) => {
  // Cargar cliente
  formData.client = {
    id: ev.cliente_id,
    nombre: ev.clientes?.nombre || '',
    rut: ev.clientes?.rut || '',
    telefono: ev.clientes?.telefono || '',
    email: ev.clientes?.email || '',
    direccion: ev.clientes?.direccion || '',
    observaciones: ev.clientes?.observaciones || ''
  };

  // Cargar propiedad
  formData.property = {
    id: ev.propiedad_id,
    direccion: ev.propiedades?.direccion || '',
    comuna: ev.propiedades?.comuna || '',
    rol_sii: ev.propiedades?.rol_sii || '',
    superficie_terreno: Number(ev.propiedades?.superficie_terreno) || 0,
    superficie_construida: Number(ev.propiedades?.superficie_construida) || 0,
    clase_construccion: ev.propiedades?.clase_construccion || 'C',
    calidad_construccion: Number(ev.propiedades?.calidad_construccion) || 3,
    antiguedad_real: Number(ev.propiedades?.antiguedad_real) || 0,
    antiguedad_aparente: Number(ev.propiedades?.antiguedad_aparente) || 0,
    observaciones: ev.propiedades?.observaciones || ''
  };

  // Cargar otros detalles
  formData.valorUfTerreno = ev.resultado_tasacion.valorUfTerreno || 0;
  formData.valorUF = ev.valor_uf_dia || 39400;
  agentName.value = ev.agent || ev.agente || 'Ximena Torres';
  comment.value = ev.comentarios || '';
  recommendation.value = ev.recomendacion || '';
  works.value = ev.obras_complementarias || [];
  comparables.value = ev.comparables_utilizados || [];
  activeEvaluationId.value = ev.id;

  // Cambiar pestaña a editor
  activeTab.value = 'nueva';
  showToast('Tasación cargada del historial.', 'success');
};

/* --- EXPORTAR INFORME --- */

const handleExportPdf = () => {
  exportToPDF({
    client: formData.client,
    property: formData.property,
    comparables: comparables.value,
    results: calculatedResults.value,
    comment: comment.value,
    recommendation: recommendation.value,
    agent: agentName.value,
    valorUF: formData.valorUF
  });
};

const handleExportExcel = () => {
  exportToExcel({
    client: formData.client,
    property: formData.property,
    results: calculatedResults.value
  });
};
</script>

<style scoped>
.app-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
  background: white;
  padding: 1.25rem 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  margin-bottom: 1.5rem;
}

.header-logo-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--accent), var(--primary));
  color: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
}

.app-header h1 {
  font-size: 1.25rem;
  margin: 0;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--primary);
}

.tagline {
  margin: 0.15rem 0 0 0;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
}

.nav-tabs {
  display: flex;
  gap: 0.5rem;
  background: #F1F5F9;
  padding: 0.25rem;
  border-radius: 8px;
}

.tab-btn {
  border: none;
  background: transparent;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  background: white;
  color: var(--primary);
  box-shadow: var(--shadow-sm);
}

/* Connection Badge */
.connection-status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #FFFBEB;
  border: 1px solid #FDE68A;
  padding: 0.4rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #92400E;
}

.connection-status-badge.connected {
  background: #ECFDF5;
  border-color: #A7F3D0;
  color: #065F46;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #F59E0B;
  display: inline-block;
}

.connection-status-badge.connected .status-dot {
  background: #10B981;
}

/* Toast */
.toast-message {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  background: #334155;
  color: white;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: var(--shadow-lg);
  z-index: 2000;
}

.toast-message.success { background: #10B981; }
.toast-message.error { background: #EF4444; }
.toast-message.info { background: #3B82F6; }

/* Workspace layout */
.app-layout {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Actions panel below trace */
.appraisal-actions {
  background: white;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
  margin-top: 1rem;
}

.actions-flex {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
}

.actions-flex .btn {
  min-width: 160px;
}

@media (max-width: 768px) {
  .actions-flex {
    flex-direction: column;
    align-items: stretch;
  }
  .actions-flex .btn {
    width: 100%;
  }
}

.btn-clear {
  color: var(--text-muted);
  background: transparent;
  border: 1px solid #CBD5E1;
}
.btn-clear:hover {
  background: #FFF5F5;
  color: #EF4444;
  border-color: #FCA5A5;
}

.warning-input {
  border-color: #FCD34D;
  background: #FFFBEB;
}
</style>
