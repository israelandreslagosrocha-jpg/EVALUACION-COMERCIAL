<template>
  <div class="panel animate-fade-in" style="animation-delay: 0.1s;" id="results-panel">
    <h2>Tasación Final</h2>
    
    <div class="results-grid" v-if="hasData">
      <div class="result-card">
        <span class="result-label">Valor del Terreno</span>
        <span class="result-value primary">{{ formatUF(results.totalTerrenoUF) }}</span>
        <span class="result-subvalue" v-if="valorUf">{{ formatCLP(results.totalTerrenoUF * valorUf) }}</span>
      </div>
      
      <div class="result-card">
        <span class="result-label">
          Valor Construcción 
          <span class="badge">Depreciada al {{ formatNumber(results.factorDepreciacion) }}%</span>
        </span>
        <span class="result-value success">{{ formatUF(results.totalConstruccionUF) }}</span>
        <span class="result-subvalue" v-if="valorUf">{{ formatCLP(results.totalConstruccionUF * valorUf) }}</span>
      </div>
      
      <div class="result-card highlight full-width">
        <span class="result-label">Valor de Venta Sugerido (Tasación Total)</span>
        <span class="result-value success">{{ formatUF(results.totalTasacionUF) }}</span>
        <span class="result-subvalue" v-if="valorUf">{{ formatCLP(results.totalTasacionUF * valorUf) }}</span>
      </div>
      
      <div class="result-card full-width rent-card">
        <span class="result-label">Cánones de Arriendo Sugeridos</span>
        <div class="rent-grid">
          <div class="rent-item">
            <span>Conservador (4%)</span>
            <strong>{{ formatCLP(results.arriendoMensualBajo * valorUf) }}</strong>
          </div>
          <div class="rent-item active">
            <span>Mercado (5%)</span>
            <strong>{{ formatCLP(results.arriendoMensualMedio * valorUf) }}</strong>
          </div>
          <div class="rent-item">
            <span>Agresivo (6.5%)</span>
            <strong>{{ formatCLP(results.arriendoMensualAlto * valorUf) }}</strong>
          </div>
        </div>
      </div>

    </div>

    <div v-else class="empty-state">
      <p>Ingresa los datos de la propiedad para ver los resultados de la tasación.</p>
    </div>

    <div class="export-actions" v-if="hasData">
      <button class="btn btn-secondary" @click="$emit('exportPdf')">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        Exportar PDF
      </button>
      <button class="btn btn-success" @click="$emit('exportExcel')">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M8 13h2"></path><path d="M8 17h2"></path><path d="M14 13h2"></path><path d="M14 17h2"></path></svg>
        Exportar Excel
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatUF, formatCLP, formatNumber } from '../logic/calculations';

const props = defineProps({
  results: {
    type: Object,
    required: true
  },
  valorUf: {
    type: Number,
    default: 0
  }
});

defineEmits(['exportPdf', 'exportExcel']);

const hasData = computed(() => {
  return props.results.totalTasacionUF > 0;
});
</script>

<style scoped>
.results-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
}

@media (min-width: 640px) {
  .results-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.full-width {
  grid-column: 1 / -1;
}

.result-card {
  background: var(--background);
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.result-card.highlight {
  background: var(--primary-light);
  color: white;
  border: none;
}

.result-card.highlight .result-label {
  color: #CBD5E1;
}

.result-card.highlight .result-value {
  font-size: 2rem;
  color: #38BDF8;
}

.result-label {
  font-size: 0.875rem;
  color: var(--text-muted);
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.badge {
  background: #E2E8F0;
  color: #475569;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.result-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-main);
}

.result-value.primary {
  color: var(--accent);
}

.result-value.success {
  color: var(--success);
}

.result-subvalue {
  font-size: 0.875rem;
  color: var(--text-muted);
  font-weight: 500;
  margin-top: -0.25rem;
}

.result-card.highlight .result-subvalue {
  color: #94A3B8;
}

.rent-card {
  background: #F1F5F9;
}

.rent-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 0.5rem;
}

.rent-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  border: 1px solid var(--border);
  text-align: center;
}

.rent-item.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
}

.rent-item span {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.rent-item strong {
  font-size: 1rem;
  color: var(--text-main);
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-muted);
  background: #F8FAFC;
  border-radius: 8px;
  border: 1px dashed #CBD5E1;
  margin-bottom: 2rem;
}

.export-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.export-actions button {
  flex: 1;
}
</style>
