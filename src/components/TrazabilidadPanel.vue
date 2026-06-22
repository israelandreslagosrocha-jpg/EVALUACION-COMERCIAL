<template>
  <div class="panel animate-fade-in">
    <div class="panel-header">
      <h2>🔍 Trazabilidad y Memoria de Cálculo</h2>
      <p>Desglose paso a paso de los cálculos y fórmulas aplicadas en esta tasación comercial.</p>
    </div>

    <div class="trace-timeline" v-if="trace && trace.length > 0">
      <div v-for="(step, index) in trace" :key="index" class="trace-step">
        <div class="step-marker">
          <span class="step-num">{{ index + 1 }}</span>
        </div>
        <div class="step-content card">
          <h4 class="step-title">{{ step.titulo }}</h4>
          <!-- Usamos white-space: pre-line para conservar saltos de línea de las obras complementarias -->
          <p class="step-desc">{{ step.descripcion }}</p>
        </div>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <p>Ingresa los datos del terreno y construcción para activar el panel de trazabilidad.</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  trace: {
    type: Array,
    required: true,
    default: () => []
  }
});
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

.panel-header {
  border-bottom: 1px solid var(--border);
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}

.panel-header h2 {
  font-size: 1.5rem;
  color: var(--primary);
  margin-bottom: 0.25rem;
}

.panel-header p {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0;
}

.trace-timeline {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
  padding-left: 1.5rem;
}

/* Línea de fondo del timeline */
.trace-timeline::before {
  content: '';
  position: absolute;
  left: 23px;
  top: 10px;
  bottom: 10px;
  width: 2px;
  background: #E2E8F0;
  z-index: 0;
}

.trace-step {
  display: flex;
  gap: 1.5rem;
  position: relative;
  z-index: 1;
}

.step-marker {
  display: flex;
  align-items: flex-start;
  margin-top: 0.25rem;
}

.step-num {
  width: 28px;
  height: 28px;
  background: var(--primary-light);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  box-shadow: 0 0 0 4px #F1F5F9;
}

.step-content {
  flex: 1;
  background: #F8FAFC;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem 1.25rem;
}

.step-title {
  margin: 0 0 0.5rem 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--primary);
}

.step-desc {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text);
  line-height: 1.6;
  white-space: pre-line; /* Muy importante para las listas con saltos de línea */
  font-family: 'Courier New', Courier, monospace;
  background: white;
  padding: 0.75rem;
  border-radius: 6px;
  border: 1px solid #E2E8F0;
}

.empty-state {
  text-align: center;
  color: var(--text-muted);
  padding: 2rem;
}
</style>
