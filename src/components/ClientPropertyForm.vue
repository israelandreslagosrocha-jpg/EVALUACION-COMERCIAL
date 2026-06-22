<template>
  <div class="panel animate-fade-in">
    <div class="panel-header">
      <h2>1. Ficha del Cliente y Propiedad</h2>
      <p>Ingresa los antecedentes del propietario y las características físicas del inmueble.</p>
    </div>

    <!-- Buscador de Clientes Existentes -->
    <div class="client-lookup-card card mb-4" v-if="clientes.length > 0">
      <div class="form-group mb-0">
        <label for="cliente-select">📋 Cargar Cliente Registrado (Opcional)</label>
        <select 
          id="cliente-select" 
          class="form-input" 
          v-model="selectedClientId" 
          @change="loadSelectedClient"
        >
          <option value="">-- Crear Nuevo Cliente --</option>
          <option v-for="c in clientes" :key="c.id" :value="c.id">
            {{ c.nombre }} (RUT: {{ c.rut || 'Sin RUT' }})
          </option>
        </select>
      </div>
    </div>

    <div class="form-grid">
      <!-- SECCIÓN CLIENTE -->
      <fieldset class="form-section">
        <legend>Datos del Cliente</legend>
        
        <div class="form-group">
          <label>Nombre Completo</label>
          <input 
            type="text" 
            class="form-input" 
            v-model="modelValue.client.nombre" 
            placeholder="Ej: Nelson Lecaro" 
            required 
          />
        </div>

        <div class="form-group">
          <label>RUT</label>
          <input 
            type="text" 
            class="form-input" 
            v-model="modelValue.client.rut" 
            placeholder="Ej: 12.345.678-9" 
            @blur="formatRutInput"
          />
        </div>

        <div class="form-group">
          <label>Teléfono</label>
          <input 
            type="text" 
            class="form-input" 
            v-model="modelValue.client.telefono" 
            placeholder="Ej: +56 9 8765 4321" 
          />
        </div>

        <div class="form-group">
          <label>Email</label>
          <input 
            type="email" 
            class="form-input" 
            v-model="modelValue.client.email" 
            placeholder="Ej: nelson@correo.com" 
          />
        </div>

        <div class="form-group span-all">
          <label>Dirección Postal</label>
          <input 
            type="text" 
            class="form-input" 
            v-model="modelValue.client.direccion" 
            placeholder="Ej: Rosario 1356, Curicó" 
          />
        </div>

        <div class="form-group span-all">
          <label>Observaciones del Cliente</label>
          <textarea 
            class="form-input" 
            rows="2" 
            v-model="modelValue.client.observaciones"
            placeholder="Comentarios sobre el cliente, trato comercial..."
          ></textarea>
        </div>
      </fieldset>

      <!-- SECCIÓN PROPIEDAD -->
      <fieldset class="form-section">
        <legend>Ficha Técnica del Inmueble</legend>

        <div class="form-group">
          <label>Dirección Propiedad</label>
          <input 
            type="text" 
            class="form-input" 
            v-model="modelValue.property.direccion" 
            placeholder="Ej: Rosario 1356" 
            required 
          />
        </div>

        <div class="form-group">
          <label>Comuna</label>
          <input 
            type="text" 
            class="form-input" 
            v-model="modelValue.property.comuna" 
            placeholder="Ej: Curicó" 
            required 
          />
        </div>

        <div class="form-group">
          <label>ROL SII</label>
          <input 
            type="text" 
            class="form-input" 
            v-model="modelValue.property.rol_sii" 
            placeholder="Ej: 00321-00042" 
          />
        </div>

        <div class="form-group">
          <label>Superficie Terreno (m²)</label>
          <input 
            type="number" 
            class="form-input highlight-field" 
            v-model.number="modelValue.property.superficie_terreno" 
            placeholder="Ej: 259" 
            min="0" step="any"
            required 
          />
        </div>

        <div class="form-group">
          <label>Superficie Construida (m²)</label>
          <input 
            type="number" 
            class="form-input highlight-field" 
            v-model.number="modelValue.property.superficie_construida" 
            placeholder="Ej: 103" 
            min="0" step="any"
            required 
          />
        </div>

        <div class="form-group">
          <label>Clase Construcción (SII)</label>
          <select class="form-input" v-model="modelValue.property.clase_construccion">
            <option v-for="(desc, cls) in classDescriptions" :key="cls" :value="cls">
              Clase {{ cls }} - {{ cls === 'F' ? 'Adobe/Madera (F)' : desc.split('.')[0] }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Calidad Construcción</label>
          <select class="form-input" v-model.number="modelValue.property.calidad_construccion">
            <option v-for="(desc, val) in qualityDescriptions" :key="val" :value="Number(val)">
              {{ val }} - {{ desc.split('(')[0] }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Antigüedad Real (Años)</label>
          <input 
            type="number" 
            class="form-input" 
            v-model.number="modelValue.property.antiguedad_real" 
            min="0" max="70"
          />
        </div>

        <div class="form-group">
          <label>Antigüedad Aparente (Años)</label>
          <input 
            type="number" 
            class="form-input" 
            v-model.number="modelValue.property.antiguedad_aparente" 
            min="0" max="70"
          />
        </div>

        <div class="form-group span-all">
          <label>Descripción / Observaciones Propiedad</label>
          <textarea 
            class="form-input" 
            rows="2" 
            v-model="modelValue.property.observaciones"
            placeholder="Describa el estado de conservación, ampliaciones, regularizaciones..."
          ></textarea>
        </div>
      </fieldset>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { dbGetClientes } from '../utils/supabase';
import chornikData from '../logic/chornikData.json' with { type: 'json' };

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
    default: () => ({
      client: { nombre: '', rut: '', telefono: '', email: '', direccion: '', observaciones: '' },
      property: { direccion: '', comuna: '', rol_sii: '', superficie_terreno: 0, superficie_construida: 0, clase_construccion: 'C', calidad_construccion: 3, antiguedad_real: 0, antiguedad_aparente: 0, observaciones: '', fotos: [] }
    })
  }
});

const emit = defineEmits(['update:modelValue']);

const clientes = ref([]);
const selectedClientId = ref('');

const classDescriptions = chornikData.classDescriptions;
const qualityDescriptions = chornikData.qualityDescriptions;

onMounted(async () => {
  try {
    clientes.value = await dbGetClientes();
  } catch (error) {
    console.error("Error al cargar clientes para autocompletado:", error);
  }
});

const loadSelectedClient = () => {
  if (!selectedClientId.value) {
    // Reset client form
    props.modelValue.client = { nombre: '', rut: '', telefono: '', email: '', direccion: '', observaciones: '' };
    return;
  }
  
  const clientObj = clientes.value.find(c => c.id === selectedClientId.value);
  if (clientObj) {
    props.modelValue.client = {
      id: clientObj.id,
      nombre: clientObj.nombre || '',
      rut: clientObj.rut || '',
      telefono: clientObj.telefono || '',
      email: clientObj.email || '',
      direccion: clientObj.direccion || '',
      observaciones: clientObj.observaciones || ''
    };
  }
};

const formatRutInput = () => {
  let rut = props.modelValue.client.rut;
  if (!rut) return;
  
  // Limpiar caracteres
  rut = rut.replace(/[^0-9kK]/g, '');
  if (rut.length < 2) return;
  
  const dv = rut.slice(-1);
  let num = rut.slice(0, -1);
  
  // Formatear con puntos
  let formated = '';
  while (num.length > 3) {
    formated = '.' + num.slice(-3) + formated;
    num = num.slice(0, -3);
  }
  formated = num + formated + '-' + dv;
  props.modelValue.client.rut = formated.toUpperCase();
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

.panel-header {
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 1rem;
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

.client-lookup-card {
  background: #F0F9FF;
  border: 1px solid #BEE3F8;
  border-radius: 8px;
  padding: 1rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 900px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.form-section {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1.25rem;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  background: #FAFAFA;
}

.form-section legend {
  font-weight: 700;
  font-size: 1rem;
  color: var(--primary-light);
  padding: 0 0.5rem;
  background: transparent;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.span-all {
  grid-column: 1 / -1;
}

.highlight-field {
  border-color: var(--accent-hover);
  background: #FFFBEB;
}

.text-muted {
  font-size: 0.75rem;
  color: var(--text-muted);
}
</style>
