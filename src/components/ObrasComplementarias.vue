<template>
  <div class="panel animate-fade-in">
    <div class="panel-header section-header-wrap">
      <div>
        <h2>3. Obras Complementarias</h2>
        <p>Registra las obras anexas (piscina, quinchos, bodegas, pavimentos) con sus respectivos valores y niveles de depreciación.</p>
      </div>
      <button class="btn btn-primary btn-sm" @click="addWork">
        ＋ Agregar Obra
      </button>
    </div>

    <!-- TABLA DE OBRAS COMPLEMENTARIAS -->
    <div v-if="works.length === 0" class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
      <p>No se han registrado obras complementarias.</p>
      <span class="sub-text">Haz clic en <strong>Agregar Obra</strong> para incorporar elementos adicionales a la tasación.</span>
    </div>

    <div class="table-responsive" v-else>
      <table class="works-table">
        <thead>
          <tr>
            <th>Tipo de Obra</th>
            <th>Superficie / Cantidad (m²)</th>
            <th>Valor Base (UF/m²)</th>
            <th>Depreciación (%)</th>
            <th>Cálculo Explicativo</th>
            <th>Total Obra (UF)</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="w in works" :key="w.id">
            <!-- Tipo de Obra -->
            <td>
              <select class="table-select w-type" v-model="w.tipo" @change="suggestBaseValue(w)">
                <option value="piscina">Piscina</option>
                <option value="quincho">Quincho</option>
                <option value="bodega">Bodega</option>
                <option value="galpón">Galpón</option>
                <option value="cobertizo">Cobertizo</option>
                <option value="estacionamiento">Estacionamientos</option>
                <option value="pavimentos">Pavimentos</option>
                <option value="cierres perimetrales">Cierres Perimetrales</option>
                <option value="Otro">Otro / Personalizado</option>
              </select>
            </td>

            <!-- Superficie / Cantidad -->
            <td>
              <input type="number" class="table-input w-m2" v-model.number="w.superficie" @input="recalc" min="0" step="any" />
            </td>

            <!-- Valor Base UF/m2 -->
            <td>
              <input type="number" class="table-input w-val" v-model.number="w.valorBaseUF" @input="recalc" min="0" step="any" />
            </td>

            <!-- Depreciación % -->
            <td>
              <div class="depr-input-wrap">
                <input type="number" class="table-input w-depr" v-model.number="w.depreciacion" @input="recalc" min="0" max="100" />
                <span class="pct">%</span>
              </div>
            </td>

            <!-- Explicación cálculo -->
            <td>
              <span class="trace-desc">
                {{ w.superficie || 0 }} m² × {{ w.valorBaseUF || 0 }} UF/m² × {{ (100 - (w.depreciacion || 0)) }}%
              </span>
            </td>

            <!-- Total Obra UF -->
            <td>
              <span class="read-only-cell font-bold">
                {{ formatUFValue(w) }}
              </span>
            </td>

            <!-- Eliminar -->
            <td>
              <button class="btn-delete" @click="removeWork(w.id)">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Total obras complementarias -->
      <div class="works-footer mt-3">
        <span class="total-label">Total Obras Complementarias:</span>
        <span class="total-value">{{ totalObrasUF.toFixed(2) }} UF</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  works: {
    type: Array,
    required: true,
    default: () => []
  }
});

const emit = defineEmits(['recalculate']);

const addWork = () => {
  props.works.push({
    id: 'work_' + Math.random().toString(36).substr(2, 9),
    tipo: 'piscina',
    superficie: 20,
    valorBaseUF: 15,
    depreciacion: 20
  });
  recalc();
};

const removeWork = (id) => {
  const idx = props.works.findIndex(w => w.id === id);
  if (idx !== -1) {
    props.works.splice(idx, 1);
  }
  recalc();
};

const recalc = () => {
  emit('recalculate');
};

const suggestBaseValue = (work) => {
  // Valores estándar sugeridos de tasación comercial en Chile
  const suggestions = {
    'piscina': { val: 12.0, depr: 15 },
    'quincho': { val: 8.0, depr: 10 },
    'bodega': { val: 6.0, depr: 20 },
    'galpón': { val: 7.0, depr: 30 },
    'cobertizo': { val: 4.0, depr: 20 },
    'estacionamiento': { val: 3.5, depr: 10 },
    'pavimentos': { val: 1.5, depr: 25 },
    'cierres perimetrales': { val: 2.0, depr: 20 },
    'Otro': { val: 5.0, depr: 0 }
  };
  
  const sugg = suggestions[work.tipo];
  if (sugg) {
    work.valorBaseUF = sugg.val;
    work.depreciacion = sugg.depr;
  }
  recalc();
};

const formatUFValue = (w) => {
  const sup = Number(w.superficie) || 0;
  const base = Number(w.valorBaseUF) || 0;
  const depr = Number(w.depreciacion) || 0;
  const total = sup * base * (1 - depr / 100);
  return total.toFixed(2) + ' UF';
};

const totalObrasUF = computed(() => {
  return props.works.reduce((acc, w) => {
    const sup = Number(w.superficie) || 0;
    const base = Number(w.valorBaseUF) || 0;
    const depr = Number(w.depreciacion) || 0;
    return acc + (sup * base * (1 - depr / 100));
  }, 0);
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

.works-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  text-align: left;
}

.works-table th {
  background: #F1F5F9;
  color: var(--primary);
  font-weight: 700;
  padding: 0.75rem;
  border-bottom: 2px solid var(--border);
  white-space: nowrap;
}

.works-table td {
  padding: 0.75rem;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.works-table tr:hover {
  background: #F8FAFC;
}

.w-type { min-width: 160px; }
.w-m2 { min-width: 90px; }
.w-val { min-width: 90px; }
.w-depr { min-width: 70px; }

.table-input {
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.35rem 0.5rem;
  font-size: 0.85rem;
  width: 100%;
  background: white;
}

.table-select {
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.35rem 0.5rem;
  font-size: 0.85rem;
  background: white;
  width: 100%;
}

.depr-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.pct {
  font-weight: 700;
  color: var(--text-muted);
}

.trace-desc {
  font-family: monospace;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.read-only-cell {
  color: var(--primary);
  font-family: monospace;
}

.font-bold {
  font-weight: 700;
}

.btn-delete {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 1rem;
}

.works-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
  background: #F8FAFC;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.total-label {
  font-weight: 700;
  color: var(--primary);
}

.total-value {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--accent);
}
</style>
