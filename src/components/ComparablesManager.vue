<template>
  <div class="panel animate-fade-in market-panel">
    <div class="panel-header section-header-wrap">
      <div>
        <h2>2. Análisis de Comparables de Mercado</h2>
        <p>Registra al menos 3 comparables del sector. El sistema calculará el valor residual de suelo usando el método Chornik.</p>
      </div>
      <div class="action-buttons-wrap">
        <!-- Reutilizar comparables -->
        <button class="btn btn-secondary btn-sm" @click="openHistorySelector">
          📂 Reutilizar Comparables
        </button>
        <!-- Cargar con OCR -->
        <button class="btn btn-accent btn-sm" @click="isOcrOpen = true">
          📷 Extraer desde Captura (OCR)
        </button>
        <!-- Agregar manual -->
        <button class="btn btn-primary btn-sm" @click="addManualComparable">
          ＋ Agregar Manual
        </button>
      </div>
    </div>

    <!-- TABLA DE COMPARABLES -->
    <div v-if="comparables.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
      <p>No se han registrado comparables aún.</p>
      <span class="sub-text">Agrégalos manualmente, impórtalos de tasaciones anteriores o usa el extractor de pantallazos OCR con IA.</span>
    </div>

    <div class="table-responsive" v-else>
      <table class="comparables-table">
        <thead>
          <tr>
            <th>Origen / Portal</th>
            <th>Precio (UF)</th>
            <th>Superficie Terreno (m²)</th>
            <th>Superficie Const. (m²)</th>
            <th>Clase/Cal./Edad</th>
            <th>UF/m² Const. Depr.</th>
            <th>Total Const. (UF)</th>
            <th>UF/m² Suelo Res.</th>
            <th>Similitud (Peso)</th>
            <th>Estado / Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="(comp, index) in comparables" 
            :key="comp.id" 
            :class="{ 'row-discarded': comp.descartado, 'row-outlier': comp.outlier }"
          >
            <!-- Origen / Portal -->
            <td>
              <div class="portal-cell">
                <span class="ref-num">Ref. {{ String(index + 1).padStart(2, '0') }}</span>
                <input type="text" class="table-input" v-model="comp.portal_origen" placeholder="Ej: PI" />
              </div>
            </td>
            
            <!-- Precio Publicación -->
            <td>
              <input type="number" class="table-input w-uf" v-model.number="comp.precio_publicacion" @input="recalc" />
              <div class="negotiated-price" title="Precio estimado de venta real (-5% de negociación)">
                Est: {{ comp.calc ? comp.calc.precioVentaUF.toFixed(1) : 0 }} UF
              </div>
            </td>
            
            <!-- Sup Terreno -->
            <td>
              <input type="number" class="table-input w-m2" v-model.number="comp.superficie_terreno" @input="recalc" />
            </td>
            
            <!-- Sup Construida -->
            <td>
              <input type="number" class="table-input w-m2" v-model.number="comp.superficie_construida" @input="recalc" />
            </td>
            
            <!-- Clase, Calidad, Antiguedad -->
            <td>
              <div class="chornik-inputs">
                <select class="table-select" v-model="comp.clase" @change="recalc">
                  <option v-for="c in let_classes" :key="c" :value="c">{{ c }}</option>
                </select>
                <select class="table-select" v-model.number="comp.calidad" @change="recalc">
                  <option v-for="q in [1,2,3,4,5]" :key="q" :value="q">{{ q }}</option>
                </select>
                <input type="number" class="table-input w-age" v-model.number="comp.antiguedad" @input="recalc" min="0" max="70" />
              </div>
            </td>
            
            <!-- UF/m² Const Depr -->
            <td>
              <span class="read-only-cell">
                {{ comp.calc ? comp.calc.constDepreciadaUFm2.toFixed(2) : '—' }}
              </span>
            </td>
            
            <!-- Total Const UF -->
            <td>
              <span class="read-only-cell">
                {{ comp.calc ? comp.calc.constValorTotalUF.toFixed(1) : '—' }} UF
              </span>
            </td>
            
            <!-- UF/m² Suelo Residual -->
            <td>
              <span class="residual-cell font-bold">
                {{ comp.calc && comp.calc.terrenoResidualUFm2 > 0 ? comp.calc.terrenoResidualUFm2.toFixed(2) : '—' }} UF
              </span>
            </td>
            
            <!-- Peso / Similitud -->
            <td>
              <select class="table-select" v-model.number="comp.peso" @change="recalc">
                <option :value="3">Alta (x3)</option>
                <option :value="2">Media (x2)</option>
                <option :value="1">Baja (x1)</option>
              </select>
            </td>
            
            <!-- Estado / Acción -->
            <td>
              <div class="action-cell">
                <button 
                  class="btn-toggle-discard" 
                  :class="{ active: comp.descartado }"
                  @click="toggleDiscard(comp)"
                  :title="comp.descartado ? 'Habilitar Muestra' : 'Descartar Muestra'"
                >
                  {{ comp.descartado ? 'Habilitar' : 'Descartar' }}
                </button>
                <button class="btn-delete" @click="removeComparable(comp.id)">🗑️</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Cuadro de Justificaciones de Descartes -->
    <div class="discard-justifications mt-4" v-if="hasDiscarded">
      <h4>Justificación de Comparables Descartados</h4>
      <div v-for="comp in discardedComps" :key="comp.id" class="justification-card mb-2">
        <span class="justification-ref">Ref. {{ comparables.indexOf(comp) + 1 }} - {{ comp.portal_origen || 'Portal' }}</span>
        <div class="justification-edit-wrap">
          <input 
            type="text" 
            class="form-input warning-input" 
            v-model="comp.justificacion_manual" 
            @change="recalc"
            placeholder="Escribe la justificación para descartar..." 
          />
          <small class="text-danger" v-if="comp.outlier && !comp.justificacion_manual">
            ⚠️ {{ comp.justificacion }}
          </small>
        </div>
      </div>
    </div>

    <!-- RESUMEN ESTADÍSTICO DE COMPARABLES -->
    <div class="market-summary-card mt-4 animate-fade-in" v-if="activeCompsCount >= 2">
      <div class="stats-header">
        <h4>Resumen Estadístico (Aceptados)</h4>
        <span class="stats-count">{{ activeCompsCount }} muestras incorporadas</span>
      </div>
      <div class="stats-grid">
        <div class="stat-box">
          <span class="stat-label">Promedio Simple Terreno</span>
          <span class="stat-value">{{ stats.averages.terrenoPromedio.toFixed(2) }} UF/m²</span>
          <span class="stat-desc">Promedio aritmético</span>
        </div>
        <div class="stat-box highlighted-stat">
          <span class="stat-label">Promedio Ponderado Terreno</span>
          <span class="stat-value">{{ stats.averages.ponderadoTerreno.toFixed(2) }} UF/m²</span>
          <span class="stat-desc">Ponderado por similitud (Recomendado)</span>
        </div>
        <div class="stat-box">
          <span class="stat-label">Desviación Estándar</span>
          <span class="stat-value">± {{ stats.averages.stdDev.toFixed(2) }} UF/m²</span>
          <span class="stat-desc" :class="{ 'text-warning': stats.averages.stdDev > 5 }">
            {{ stats.averages.stdDev > 5 ? 'Alta distorsión en la muestra' : 'Dispersión aceptable' }}
          </span>
        </div>
        <div class="stat-box">
          <span class="stat-label">Construcción Depr. Promedio</span>
          <span class="stat-value">{{ stats.averages.constructionPromedio.toFixed(2) }} UF/m²</span>
          <span class="stat-desc">Estimado de mercado</span>
        </div>
      </div>
      <div class="apply-stats-footer">
        <button class="btn btn-secondary btn-apply" @click="applyAverages(stats.averages.ponderadoTerreno)">
          🎯 Aplicar Promedio Ponderado a la Tasación ({{ stats.averages.ponderadoTerreno.toFixed(2) }} UF/m²)
        </button>
      </div>
    </div>

    <!-- MODAL OCR -->
    <OCRModal 
      :is-open="isOcrOpen" 
      @close="isOcrOpen = false" 
      @import="handleOcrImport" 
    />

    <!-- MODAL SELECTOR DE HISTORIAL DE COMPARABLES -->
    <div class="modal-backdrop animate-fade-in" v-if="isHistorySelectorOpen">
      <div class="modal-container card glassmorphism animate-slide-up">
        <div class="modal-header">
          <h3>Seleccionar Comparables Históricos</h3>
          <button class="btn-close" @click="isHistorySelectorOpen = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="description">Selecciona comparables que hayas ingresado en tasaciones anteriores.</p>
          <div class="form-group mb-3">
            <label>Filtrar por Comuna</label>
            <input type="text" class="form-input" v-model="comunaFilter" placeholder="Ej: Curicó" @input="loadHistoricalComparables" />
          </div>
          <div class="history-comps-list" v-if="historicalComparables.length > 0">
            <div 
              v-for="hc in historicalComparables" 
              :key="hc.id" 
              class="history-comp-item"
              @click="toggleSelectHistoryComp(hc)"
              :class="{ selected: isHistoryCompSelected(hc.id) }"
            >
              <div class="hc-header">
                <strong>{{ hc.portal_origen }} ({{ hc.direccion }}, {{ hc.comuna }})</strong>
                <span>{{ hc.precio_publicacion }} UF</span>
              </div>
              <div class="hc-details">
                <span>Construcción: {{ hc.superficie_construida }} m² (Clase {{ hc.clase }}{{ hc.calidad }})</span> | 
                <span>Terreno: {{ hc.superficie_terreno }} m²</span> | 
                <span>Edad: {{ hc.antiguedad }} años</span>
              </div>
            </div>
          </div>
          <div class="empty-state" v-else>
            <p>No se encontraron comparables en el historial.</p>
          </div>
        </div>
        <div class="modal-footer results-actions mt-3">
          <button class="btn btn-secondary" @click="isHistorySelectorOpen = false">Cancelar</button>
          <button class="btn btn-primary" @click="importSelectedHistoricalComps" :disabled="selectedHistoryCompIds.length === 0">
            Importar Seleccionados ({{ selectedHistoryCompIds.length }})
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import OCRModal from './OCRModal.vue';
import { analyzeMarketComparables } from '../logic/calculations';
import { dbGetComparables } from '../utils/supabase';

const props = defineProps({
  comparables: {
    type: Array,
    required: true,
    default: () => []
  }
});

const emit = defineEmits(['apply-terrain-value', 'recalculate']);

const isOcrOpen = ref(false);
const isHistorySelectorOpen = ref(false);
const historicalComparables = ref([]);
const selectedHistoryCompIds = ref([]);
const comunaFilter = ref('');

const let_classes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

onMounted(() => {
  recalc();
});

const recalc = () => {
  emit('recalculate');
};

const stats = computed(() => {
  return analyzeMarketComparables(props.comparables);
});

const activeCompsCount = computed(() => {
  return props.comparables.filter(c => !c.descartado).length;
});

const hasDiscarded = computed(() => {
  return props.comparables.some(c => c.descartado);
});

const discardedComps = computed(() => {
  return props.comparables.filter(c => c.descartado);
});

const addManualComparable = () => {
  const ufDia = 39400; // default aprox
  props.comparables.push({
    id: 'manual_' + Math.random().toString(36).substr(2, 9),
    portal_origen: 'Portal Inmobiliario',
    fecha_captura: new Date().toISOString().split('T')[0],
    precio_publicacion: 5000,
    uf: ufDia,
    superficie_terreno: 300,
    superficie_construida: 120,
    clase: 'C',
    calidad: 3,
    antiguedad: 20,
    direccion: '',
    comuna: '',
    peso: 2,
    descartado_manual: false,
    justificacion_manual: ''
  });
  recalc();
};

const handleOcrImport = (ocrData) => {
  props.comparables.push({
    id: 'ocr_' + Math.random().toString(36).substr(2, 9),
    portal_origen: ocrData.portal,
    fecha_captura: new Date().toISOString().split('T')[0],
    precio_publicacion: ocrData.precio,
    uf: ocrData.uf_dia,
    superficie_terreno: ocrData.superficie_terreno,
    superficie_construida: ocrData.superficie_construida,
    dormitorios: ocrData.dormitorios,
    banos: ocrData.banos,
    clase: 'C', // Default que el usuario puede cambiar
    calidad: 3, // Default
    antiguedad: 20, // Default
    direccion: ocrData.direccion,
    comuna: ocrData.comuna,
    peso: 2,
    descartado_manual: false,
    justificacion_manual: ''
  });
  recalc();
};

const removeComparable = (id) => {
  const idx = props.comparables.findIndex(c => c.id === id);
  if (idx !== -1) {
    props.comparables.splice(idx, 1);
  }
  recalc();
};

const toggleDiscard = (comp) => {
  comp.descartado_manual = !comp.descartado_manual;
  recalc();
};

const applyAverages = (val) => {
  if (val > 0) {
    emit('apply-terrain-value', Number(val.toFixed(2)));
  }
};

/* --- HISTORIAL DE COMPARABLES --- */

const openHistorySelector = async () => {
  isHistorySelectorOpen.value = true;
  selectedHistoryCompIds.value = [];
  await loadHistoricalComparables();
};

const loadHistoricalComparables = async () => {
  try {
    historicalComparables.value = await dbGetComparables(comunaFilter.value);
  } catch (error) {
    console.error("Error al cargar comparables del historial:", error);
  }
};

const toggleSelectHistoryComp = (hc) => {
  const idx = selectedHistoryCompIds.value.indexOf(hc.id);
  if (idx === -1) {
    selectedHistoryCompIds.value.push(hc.id);
  } else {
    selectedHistoryCompIds.value.splice(idx, 1);
  }
};

const isHistoryCompSelected = (id) => {
  return selectedHistoryCompIds.value.includes(id);
};

const importSelectedHistoricalComps = () => {
  selectedHistoryCompIds.value.forEach(id => {
    const comp = historicalComparables.value.find(hc => hc.id === id);
    if (comp) {
      props.comparables.push({
        ...comp,
        id: 'imported_' + Math.random().toString(36).substr(2, 9), // Nuevo ID
        peso: 2,
        descartado_manual: false,
        justificacion_manual: ''
      });
    }
  });
  isHistorySelectorOpen.value = false;
  recalc();
};
</script>

<style scoped>
.panel {
  background: white;
  border-radius: 12px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.section-header-wrap {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}

.section-header-wrap h2 {
  font-size: 1.5rem;
  color: var(--primary);
  margin-bottom: 0.25rem;
}

.section-header-wrap p {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0;
}

.action-buttons-wrap {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-accent {
  background: linear-gradient(135deg, #7C3AED, #4F46E5);
  color: white;
  border: none;
}
.btn-accent:hover {
  background: linear-gradient(135deg, #6D28D9, #4338CA);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 1.5rem;
  text-align: center;
  color: var(--text-muted);
  border: 2px dashed #CBD5E1;
  border-radius: 10px;
}

.empty-state p {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.empty-state .sub-text {
  font-size: 0.85rem;
  max-width: 450px;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.comparables-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  text-align: left;
}

.comparables-table th {
  background: #F1F5F9;
  color: var(--primary);
  font-weight: 700;
  padding: 0.75rem;
  border-bottom: 2px solid var(--border);
  white-space: nowrap;
}

.comparables-table td {
  padding: 0.75rem;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.comparables-table tr:hover {
  background: #F8FAFC;
}

.row-discarded {
  opacity: 0.5;
  background: #FFF5F5;
}

.row-outlier {
  background: #FEF2F2;
}

.ref-num {
  font-weight: 700;
  font-size: 0.75rem;
  color: var(--accent);
  margin-right: 0.25rem;
  white-space: nowrap;
}

.portal-cell {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 110px;
}

.table-input {
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.35rem 0.5rem;
  font-size: 0.85rem;
  width: 100%;
  background: white;
}

.w-uf { min-width: 80px; }
.w-m2 { min-width: 70px; }
.w-age { min-width: 45px; }

.table-select {
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.35rem 0.5rem;
  font-size: 0.85rem;
  background: white;
}

.negotiated-price {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: 0.2rem;
}

.chornik-inputs {
  display: flex;
  gap: 0.2rem;
  min-width: 130px;
}

.read-only-cell {
  color: var(--text-muted);
  font-family: monospace;
}

.residual-cell {
  color: var(--success);
  font-family: monospace;
}

.font-bold {
  font-weight: 700;
}

.action-cell {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.btn-toggle-discard {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 4px;
  border: 1px solid #CBD5E1;
  background: white;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-toggle-discard:hover {
  background: #EF4444;
  color: white;
  border-color: #EF4444;
}

.btn-toggle-discard.active {
  background: #10B981;
  color: white;
  border-color: #10B981;
}

.btn-delete {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 1rem;
}

/* Descartes panel */
.discard-justifications {
  background: #FFF5F5;
  border: 1px solid #FEE2E2;
  border-radius: 8px;
  padding: 1rem;
}

.discard-justifications h4 {
  margin: 0 0 0.75rem;
  color: #991B1B;
  font-size: 0.95rem;
}

.justification-card {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 1rem;
  align-items: center;
}

.justification-ref {
  font-weight: 700;
  font-size: 0.8rem;
  color: #991B1B;
}

.justification-edit-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.warning-input {
  border-color: #FCA5A5;
  background: white;
}

.text-danger {
  font-size: 0.75rem;
  color: #EF4444;
}

/* Stats */
.market-summary-card {
  background: linear-gradient(135deg, #1E293B, #0F172A);
  color: white;
  border-radius: 12px;
  padding: 1.5rem;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #334155;
  padding-bottom: 0.75rem;
  margin-bottom: 1rem;
}

.stats-header h4 {
  margin: 0;
  font-size: 1.1rem;
}

.stats-count {
  font-size: 0.75rem;
  color: #38BDF8;
  background: rgba(56, 189, 248, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1.25rem;
}

.stat-box {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  border-left: 3px solid #334155;
  padding-left: 0.75rem;
}

.stat-box.highlighted-stat {
  border-left-color: #38BDF8;
  background: rgba(56, 189, 248, 0.03);
  border-radius: 0 8px 8px 0;
  padding: 0.5rem 0.75rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #94A3B8;
  font-weight: 500;
}

.stat-value {
  font-size: 1.35rem;
  font-weight: 700;
  color: white;
}

.stat-desc {
  font-size: 0.7rem;
  color: #64748B;
}

.text-warning {
  color: #FBBF24;
}

.apply-stats-footer {
  border-top: 1px solid #334155;
  padding-top: 1rem;
}

.btn-apply {
  background: #38BDF8;
  color: #0F172A;
  font-weight: 700;
  width: 100%;
  justify-content: center;
  border: none;
}

.btn-apply:hover {
  background: #0ea5e9;
  transform: translateY(-1px);
}

/* History Modal */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  width: 100%;
  max-width: 600px;
  background: white;
  border-radius: 16px;
  box-shadow: var(--shadow-xl);
  overflow: hidden;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--primary);
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--text-muted);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.history-comps-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.history-comp-item {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.history-comp-item:hover {
  border-color: var(--accent);
  background: #F8FAFC;
}

.history-comp-item.selected {
  border-color: var(--accent);
  background: #F0F9FF;
}

.hc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.hc-details {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
