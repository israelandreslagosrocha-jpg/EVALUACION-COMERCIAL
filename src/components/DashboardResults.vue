<template>
  <div class="results-dashboard animate-fade-in" v-if="results">
    <!-- MÉTRIQUES CLAVE EN TIEMPO REAL -->
    <div class="metrics-row">
      <!-- VALOR PROBABLE DE MERCADO -->
      <div class="metric-card main-card card glassmorphism animate-pulse-slow">
        <span class="metric-badge">Valor Comercial Probable</span>
        <h3 class="clp-value">{{ formatCLP(results.valorProbableCLP) }}</h3>
        <span class="uf-value">{{ formatUF(results.valorProbableUF) }}</span>
        <div class="range-indicator">
          <span>Rango de Mercado sugerido:</span>
          <strong>{{ formatUF(results.valorMinimoUF) }} — {{ formatUF(results.valorMaximoUF) }}</strong>
        </div>
      </div>

      <!-- DESGLOSE SECUNDARIO -->
      <div class="sub-metrics">
        <div class="metric-card card">
          <span class="sub-label">Valor del Terreno</span>
          <span class="sub-value">{{ formatUF(results.totalTerrenoUF) }}</span>
          <span class="sub-desc">{{ results.m2Terreno }} m² @ {{ results.valorUfTerreno }} UF/m²</span>
        </div>
        <div class="metric-card card">
          <span class="sub-label">Construcción Depreciada</span>
          <span class="sub-value">{{ formatUF(results.totalConstruccionUF) }}</span>
          <span class="sub-desc">{{ results.m2Construido }} m² @ {{ results.constDepreciadaUFm2.toFixed(2) }} UF/m²</span>
        </div>
        <div class="metric-card card">
          <span class="sub-label">Obras Complementarias</span>
          <span class="sub-value">{{ formatUF(results.totalObrasUF) }}</span>
          <span class="sub-desc">{{ results.processedWorks.length }} elementos agregados</span>
        </div>
      </div>
    </div>

    <!-- TABLA DE ARRIENDOS SUGERIDOS -->
    <div class="panel mt-4">
      <div class="panel-header">
        <h3>📊 Canon de Arriendo Sugerido (Rentabilidad Anual)</h3>
        <p>Estimación del canon mensual de arriendo basado en diferentes tasas de retorno sobre el valor comercial.</p>
      </div>

      <div class="table-responsive">
        <table class="arriendo-table">
          <thead>
            <tr>
              <th>Retorno Anual (%)</th>
              <th>Canon Mínimo (-5% Margen)</th>
              <th class="active-col">Canon Probable (Mercado)</th>
              <th>Canon Máximo (+5% Margen)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rent in results.arriendoSugerido" :key="rent.rate">
              <td class="font-bold">{{ rent.rate.toFixed(1) }} %</td>
              <td class="clp-min">
                {{ formatCLP(rent.minCLP) }} <span class="uf-inline">({{ rent.minUF.toFixed(1) }} UF)</span>
              </td>
              <td class="clp-prob active-col">
                {{ formatCLP(rent.probCLP) }} <span class="uf-inline font-bold">({{ rent.probUF.toFixed(1) }} UF)</span>
              </td>
              <td class="clp-max">
                {{ formatCLP(rent.maxCLP) }} <span class="uf-inline">({{ rent.maxUF.toFixed(1) }} UF)</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatCLP, formatUF } from '../logic/calculations';

const props = defineProps({
  results: {
    type: Object,
    required: true
  }
});
</script>

<style scoped>
.results-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.metrics-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 900px) {
  .metrics-row {
    grid-template-columns: 1.2fr 1fr;
  }
}

.metric-card {
  padding: 1.5rem;
  border-radius: 12px;
  background: white;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* Tarjeta principal con degradado y glassmorphism */
.main-card {
  background: linear-gradient(135deg, #1E1B4B, #312E81);
  color: white;
  border: none;
  justify-content: center;
  box-shadow: var(--shadow-lg);
  padding: 2.25rem 2rem;
}

.metric-badge {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #38BDF8;
  margin-bottom: 0.5rem;
}

.clp-value {
  font-size: 2.5rem;
  font-weight: 900;
  margin: 0 0 0.25rem 0;
  color: white;
  letter-spacing: -0.02em;
}

.uf-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #94A3B8;
  margin-bottom: 1.5rem;
}

.range-indicator {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1rem;
  font-size: 0.875rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.range-indicator strong {
  color: #38BDF8;
  font-size: 1.1rem;
}

.sub-metrics {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

@media (min-width: 580px) {
  .sub-metrics {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 900px) {
  .sub-metrics {
    grid-template-columns: 1fr;
  }
}

.sub-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.sub-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--primary);
}

.sub-desc {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

/* Panel */
.panel {
  background: white;
  border-radius: 12px;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  padding: 1.5rem;
}

.panel-header {
  border-bottom: 1px solid var(--border);
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}

.panel-header h3 {
  font-size: 1.25rem;
  color: var(--primary);
  margin-bottom: 0.25rem;
}

.panel-header p {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin: 0;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.arriendo-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.875rem;
}

.arriendo-table th {
  background: #F1F5F9;
  color: var(--primary);
  font-weight: 700;
  padding: 0.75rem;
  border-bottom: 2px solid var(--border);
}

.arriendo-table td {
  padding: 0.75rem;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.arriendo-table tr:hover {
  background: #F8FAFC;
}

.active-col {
  background: rgba(56, 189, 248, 0.05);
  font-weight: 700;
}

.font-bold {
  font-weight: 700;
}

.clp-min { color: var(--text); }
.clp-prob { color: var(--accent); }
.clp-max { color: var(--text); }

.uf-inline {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-left: 0.25rem;
}
</style>
