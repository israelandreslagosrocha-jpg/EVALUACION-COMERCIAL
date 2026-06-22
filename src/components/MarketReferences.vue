<template>
  <div class="panel animate-fade-in market-panel">
    <div class="section-header">
      <div>
        <h2>Referencias de Mercado</h2>
        <p style="color: var(--text-muted); font-size: 0.875rem; margin: 0;">
          Agrega propiedades comparables del sector para calcular los promedios automáticamente.
        </p>
      </div>
      <button class="btn btn-primary btn-sm" @click="addReference" :disabled="references.length >= 10">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Agregar
      </button>
    </div>

    <div v-if="references.length === 0" class="empty-references">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
      <p>Aún no hay referencias. Haz clic en <strong>Agregar</strong> para empezar.</p>
    </div>

    <div class="references-list" v-else>
      <div 
        v-for="(ref, index) in references" 
        :key="ref.id" 
        class="reference-card"
        :class="{ 'has-error': hasError(ref) }"
      >
        <div class="ref-header">
          <span class="ref-number">Ref. {{ String(index + 1).padStart(2, '0') }}</span>
          <button class="btn-remove" @click="removeReference(ref.id)" title="Eliminar">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
          </button>
        </div>

        <div class="form-group">
          <label>Link del Portal (referencia)</label>
          <div class="link-input-wrap">
            <input 
              type="url" 
              class="form-input" 
              v-model="ref.url" 
              @blur="fetchLinkData(ref)"
              placeholder="https://portalinmobiliario.com/..."
            />
            <span v-if="ref.loading" class="loading-spinner">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
            </span>
            <a v-else-if="ref.url" :href="ref.url" target="_blank" rel="noopener" class="link-open" title="Abrir en nueva pestaña">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          </div>
        </div>

        <div class="ref-inputs">
          <div class="form-group">
            <label>Precio de Venta (UF)</label>
            <input 
              type="number" 
              class="form-input" 
              v-model="ref.precioUF" 
              placeholder="Ej: 3500"
              min="0" step="1"
            />
          </div>
          <div class="form-group">
            <label>m² Construidos</label>
            <input 
              type="number" 
              class="form-input" 
              v-model="ref.m2Construido" 
              placeholder="Ej: 120"
              min="0" step="1"
            />
          </div>
          <div class="form-group">
            <label>m² Terreno</label>
            <input 
              type="number" 
              class="form-input" 
              v-model="ref.m2Terreno" 
              placeholder="Ej: 300"
              min="0" step="1"
            />
          </div>
          <div class="form-group">
            <label>Clase</label>
            <select class="form-input" v-model="ref.clase">
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
              <option value="F">F</option>
              <option value="G">G</option>
              <option value="H">H</option>
              <option value="I">I</option>
            </select>
          </div>
          <div class="form-group">
            <label>Antigüedad (años)</label>
            <input 
              type="number" 
              class="form-input" 
              v-model="ref.antiguedad" 
              placeholder="Ej: 20"
              min="0" max="70" step="1"
            />
          </div>
          <div class="form-group result-inline">
            <label>UF/m² Terreno</label>
            <span class="computed-value" :class="{ valid: ufPorM2Terreno(ref) > 0 }">
              {{ ufPorM2Terreno(ref) > 0 ? ufPorM2Terreno(ref).toFixed(2) + ' UF' : '—' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Resultados del análisis -->
    <div class="market-summary" v-if="validRefs.length >= 2">
      <div class="summary-grid">
        <div class="summary-card">
          <span class="summary-label">Promedio UF/m² Terreno</span>
          <span class="summary-value">{{ promedioTerreno.toFixed(2) }} UF</span>
          <span class="summary-hint">{{ validRefs.length }} referencias válidas</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">Precio promedio de venta</span>
          <span class="summary-value">{{ promedioVenta.toFixed(0) }} UF</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">Promedio m² Construidos</span>
          <span class="summary-value">{{ promedioM2Construido.toFixed(0) }} m²</span>
        </div>
      </div>
      <button class="btn btn-primary btn-apply" @click="applyAverages">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        Aplicar promedios al formulario de tasación
      </button>
    </div>
    <div class="market-hint" v-else-if="references.length > 0">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      Necesitas al menos 2 referencias con datos completos para calcular promedios.
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { getDepreciation } from '../logic/chornik';

const emit = defineEmits(['apply-averages']);

let nextId = 1;

const references = ref([]);

const addReference = () => {
  references.value.push({
    id: nextId++,
    url: '',
    precioUF: '',
    m2Construido: '',
    m2Terreno: '',
    clase: 'C',
    antiguedad: '20',
    loading: false
  });
};

const fetchLinkData = async (refItem) => {
  if (!refItem.url) return;

  // Basic check to prevent re-fetching if data already exists, unless they want to override
  if (refItem.precioUF && refItem.m2Construido && refItem.m2Terreno) return;

  refItem.loading = true;
  try {
    // Usamos un proxy CORS público para poder leer el HTML de otra página desde el navegador
    const proxyUrl = 'https://api.allorigins.win/get?url=';
    const targetUrl = encodeURIComponent(refItem.url);
    
    const response = await fetch(proxyUrl + targetUrl);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    const htmlString = data.contents;
    
    // Extracción heurística (muy básica, puede fallar si los portales cambian o tienen anti-bots)
    // 1. Intentar encontrar Precio en UF
    let priceMatch = htmlString.match(/UF\s*([\d\.]+)/i); // Ej: UF 3.500
    if (!priceMatch) priceMatch = htmlString.match(/([\d\.]+)\s*UF/i); // Ej: 3.500 UF
    
    if (priceMatch && !refItem.precioUF) {
       const cleanPrice = priceMatch[1].replace(/\./g, '');
       const parsedPrice = parseFloat(cleanPrice);
       if (!isNaN(parsedPrice) && parsedPrice > 100) { // Sanity check
           refItem.precioUF = parsedPrice;
       }
    }

    // 2. Intentar encontrar m2 Construidos/Útiles
    let m2CMatch = htmlString.match(/([\d\.\,]+)\s*m²\s*(útiles|construidos)/i);
    if (!m2CMatch) m2CMatch = htmlString.match(/(útiles|construidos).*?([\d\.\,]+)\s*m²/i);
    
    if (m2CMatch && !refItem.m2Construido) {
         // Toma el grupo que es el número
         const valStr = (m2CMatch[1] === 'útiles' || m2CMatch[1] === 'construidos') ? m2CMatch[2] : m2CMatch[1];
         const cleanM2 = valStr.replace(/\./g, '').replace(',', '.');
         const parsedM2 = parseFloat(cleanM2);
         if (!isNaN(parsedM2)) refItem.m2Construido = parsedM2;
    }

    // 3. Intentar encontrar m2 Terreno/Totales
    let m2TMatch = htmlString.match(/([\d\.\,]+)\s*m²\s*(totales|terreno)/i);
    if (!m2TMatch) m2TMatch = htmlString.match(/(totales|terreno).*?([\d\.\,]+)\s*m²/i);
    
     if (m2TMatch && !refItem.m2Terreno) {
         const valStr = (m2TMatch[1] === 'totales' || m2TMatch[1] === 'terreno') ? m2TMatch[2] : m2TMatch[1];
         const cleanM2 = valStr.replace(/\./g, '').replace(',', '.');
         const parsedM2 = parseFloat(cleanM2);
         if (!isNaN(parsedM2)) refItem.m2Terreno = parsedM2;
    }

  } catch (error) {
    console.error("Error extrayendo datos del link:", error);
    // Falla silenciosa, el usuario puede ingresarlos a mano
  } finally {
    refItem.loading = false;
  }
};

const removeReference = (id) => {
  references.value = references.value.filter(r => r.id !== id);
};

const hasError = (ref) => {
  return (ref.precioUF || ref.m2Construido || ref.m2Terreno) &&
         (!ref.precioUF || !ref.m2Construido || !ref.m2Terreno);
};

const ufPorM2Terreno = (ref) => {
  const precio = Number(ref.precioUF) || 0;
  const m2c = Number(ref.m2Construido) || 0;
  const m2t = Number(ref.m2Terreno) || 0;
  const edad = Number(ref.antiguedad) || 0;

  if (!precio || !m2c || !m2t) return 0;

  // Estimamos valor de construcción depreciada por Chornik para extraer terreno
  const depr = getDepreciation(ref.clase, edad);
  const valorConstEst = m2c * 18 * depr; // usamos base estándar 18 UF/m²
  const valorTerreno = precio - valorConstEst;

  if (valorTerreno <= 0) return 0;
  return valorTerreno / m2t;
};

const validRefs = computed(() => {
  return references.value.filter(r => ufPorM2Terreno(r) > 0);
});

const promedioTerreno = computed(() => {
  if (!validRefs.value.length) return 0;
  const sum = validRefs.value.reduce((acc, r) => acc + ufPorM2Terreno(r), 0);
  return sum / validRefs.value.length;
});

const promedioVenta = computed(() => {
  if (!validRefs.value.length) return 0;
  const sum = validRefs.value.reduce((acc, r) => acc + (Number(r.precioUF) || 0), 0);
  return sum / validRefs.value.length;
});

const promedioM2Construido = computed(() => {
  if (!validRefs.value.length) return 0;
  const sum = validRefs.value.reduce((acc, r) => acc + (Number(r.m2Construido) || 0), 0);
  return sum / validRefs.value.length;
});

const applyAverages = () => {
  emit('apply-averages', {
    valorUfTerreno: promedioTerreno.value.toFixed(2)
  });
};
</script>

<style scoped>
.market-panel {
  grid-column: 1 / -1;
  margin-top: 1rem;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  white-space: nowrap;
}

.empty-references {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2.5rem 1rem;
  text-align: center;
  color: var(--text-muted);
  border: 1px dashed #CBD5E1;
  border-radius: 8px;
}

.references-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.reference-card {
  background: #F8FAFC;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1.25rem;
  transition: border-color 0.2s;
}

.reference-card.has-error {
  border-color: #FCA5A5;
  background: #FFF5F5;
}

.ref-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  background: var(--background);
  color: var(--text-muted);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.ref-number {
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--accent);
  letter-spacing: 0.05em;
}

.btn-remove {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #94A3B8;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-remove:hover {
  color: #EF4444;
  background: #FEE2E2;
}

.link-input-wrap {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.link-input-wrap .form-input {
  flex: 1;
}

.link-open {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  background: var(--accent);
  color: white;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.2s;
}

.link-open:hover {
  background: var(--accent-hover);
}

.ref-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.result-inline {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.computed-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #94A3B8;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid var(--border);
  border-radius: 8px;
  text-align: center;
}

.computed-value.valid {
  color: var(--success);
  border-color: #A7F3D0;
  background: #F0FDF4;
}

/* Market Summary */
.market-summary {
  background: linear-gradient(135deg, var(--primary-light), var(--primary));
  border-radius: 10px;
  padding: 1.5rem;
  color: white;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-label {
  font-size: 0.75rem;
  color: #94A3B8;
  font-weight: 500;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
}

.summary-hint {
  font-size: 0.75rem;
  color: #38BDF8;
}

.btn-apply {
  background: white;
  color: var(--primary);
  font-weight: 600;
  width: 100%;
  justify-content: center;
}

.btn-apply:hover {
  background: #F1F5F9;
  transform: translateY(-1px);
}

.market-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-muted);
  font-size: 0.875rem;
  padding: 1rem;
  background: #FEF3C7;
  border: 1px solid #FDE68A;
  border-radius: 8px;
  color: #92400E;
}

select.form-input {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748B%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
  background-repeat: no-repeat;
  background-position: right .7em top 50%;
  background-size: .65em auto;
}
</style>
