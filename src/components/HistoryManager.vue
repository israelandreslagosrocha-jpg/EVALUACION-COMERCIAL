<template>
  <div class="panel animate-fade-in">
    <div class="panel-header history-header">
      <div>
        <h2>📋 Historial de Tasaciones Guardadas</h2>
        <p>Busca, abre o elimina evaluaciones inmobiliarias registradas en el sistema.</p>
      </div>
      <button class="btn btn-secondary btn-sm" @click="loadHistory">
        🔄 Actualizar
      </button>
    </div>

    <!-- Buscador -->
    <div class="filters-card card mb-4">
      <div class="filters-grid">
        <div class="form-group">
          <label>Buscar por Cliente</label>
          <input 
            type="text" 
            class="form-input" 
            v-model="searchClient" 
            placeholder="Nombre o RUT..." 
          />
        </div>
        <div class="form-group">
          <label>Filtrar por Comuna</label>
          <input 
            type="text" 
            class="form-input" 
            v-model="searchComuna" 
            placeholder="Curicó, Valparaíso..." 
          />
        </div>
      </div>
    </div>

    <!-- Lista del historial -->
    <div v-if="loading" class="loading-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
      <p>Cargando registros...</p>
    </div>

    <div v-else-if="filteredEvaluations.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="13" y2="17"></line></svg>
      <p>No se encontraron tasaciones guardadas.</p>
    </div>

    <div class="table-responsive" v-else>
      <table class="history-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Propiedad / Ubicación</th>
            <th>Valor Comercial</th>
            <th>Comuna</th>
            <th>Agente</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ev in filteredEvaluations" :key="ev.id">
            <td class="date-cell font-bold">{{ formatDate(ev.fecha) }}</td>
            <td>
              <div class="client-cell">
                <strong>{{ ev.clientes?.nombre || 'Sin Nombre' }}</strong>
                <small class="text-muted">{{ ev.clientes?.rut || 'Sin RUT' }}</small>
              </div>
            </td>
            <td>
              <div class="property-cell">
                <span>{{ ev.propiedades?.direccion || 'Sin Dirección' }}</span>
                <small class="text-muted" v-if="ev.propiedades?.rol_sii">ROL: {{ ev.propiedades.rol_sii }}</small>
              </div>
            </td>
            <td>
              <div class="price-cell font-bold">
                <span class="clp">{{ formatCLP(ev.resultado_tasacion.valorProbableCLP) }}</span>
                <span class="uf">{{ formatUF(ev.resultado_tasacion.valorProbableUF) }}</span>
              </div>
            </td>
            <td>{{ ev.propiedades?.comuna || '—' }}</td>
            <td>{{ ev.agente || '—' }}</td>
            <td>
              <div class="actions-cell">
                <button class="btn btn-secondary btn-xs" @click="loadEvaluation(ev)">
                  📂 Cargar
                </button>
                <button class="btn-delete" @click="deleteEvaluation(ev.id)" title="Eliminar Tasación">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { dbGetEvaluaciones, dbDeleteEvaluacion } from '../utils/supabase';
import { formatCLP, formatUF } from '../logic/calculations';

const emit = defineEmits(['load']);

const evaluations = ref([]);
const loading = ref(false);
const searchClient = ref('');
const searchComuna = ref('');

onMounted(() => {
  loadHistory();
});

const loadHistory = async () => {
  loading.value = true;
  try {
    evaluations.value = await dbGetEvaluaciones();
  } catch (error) {
    console.error("Error al cargar historial:", error);
  } finally {
    loading.value = false;
  }
};

const filteredEvaluations = computed(() => {
  return evaluations.value.filter(ev => {
    const clientName = ev.clientes?.nombre?.toLowerCase() || '';
    const clientRut = ev.clientes?.rut?.toLowerCase() || '';
    const comuna = ev.propiedades?.comuna?.toLowerCase() || '';
    
    const matchesClient = clientName.includes(searchClient.value.toLowerCase()) || 
                          clientRut.includes(searchClient.value.toLowerCase());
    const matchesComuna = comuna.includes(searchComuna.value.toLowerCase());
    
    return matchesClient && matchesComuna;
  });
});

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const loadEvaluation = (ev) => {
  emit('load', ev);
};

const deleteEvaluation = async (id) => {
  if (confirm("¿Estás seguro de que deseas eliminar esta tasación? Esta acción borrará la evaluación e historial asociado de forma permanente.")) {
    try {
      await dbDeleteEvaluacion(id);
      await loadHistory();
    } catch (error) {
      console.error("Error al borrar tasación:", error);
      alert("Hubo un problema al borrar el registro.");
    }
  }
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

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border);
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}

.history-header h2 {
  font-size: 1.5rem;
  color: var(--primary);
  margin-bottom: 0.25rem;
}

.history-header p {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0;
}

.filters-card {
  background: #F8FAFC;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 580px) {
  .filters-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: var(--text-muted);
}

.spin {
  animation: spin 1s linear infinite;
  color: var(--accent);
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

.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  text-align: left;
}

.history-table th {
  background: #F1F5F9;
  color: var(--primary);
  font-weight: 700;
  padding: 0.75rem;
  border-bottom: 2px solid var(--border);
  white-space: nowrap;
}

.history-table td {
  padding: 0.75rem;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.history-table tr:hover {
  background: #F8FAFC;
}

.font-bold {
  font-weight: 700;
}

.client-cell, .property-cell, .price-cell {
  display: flex;
  flex-direction: column;
}

.price-cell .clp {
  color: var(--accent);
}

.price-cell .uf {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.text-muted {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.btn-delete {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 1rem;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}
</style>
