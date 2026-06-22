<template>
  <div class="panel animate-fade-in">
    <h2>Datos de la Propiedad</h2>
    <p style="color: var(--text-muted); margin-bottom: 1.5rem; font-size: 0.875rem;">
      Ingresa los parámetros del terreno y construcción para calcular la tasación con el modelo Chornik.
    </p>

    <div class="form-group">
      <label for="valorUF">Valor Actual de la UF (CLP)</label>
      <input 
        type="number" 
        id="valorUF"
        class="form-input" 
        v-model="modelValue.valorUF" 
        placeholder="Cargando..."
        min="0"
        step="1"
      />
      <small class="hint">Actualizado automáticamente hoy (mindicador.cl)</small>
    </div>

    <div class="form-row">
      <div class="form-group half">
        <label for="m2Terreno">Superficie Terreno (m²)</label>
        <input 
          type="number" 
          id="m2Terreno"
          class="form-input" 
          v-model="modelValue.m2Terreno" 
          placeholder="Ej: 300"
          min="0"
          step="0.1"
        />
      </div>
      <div class="form-group half">
        <label for="m2Construido">Superficie Construida (m²)</label>
        <input 
          type="number" 
          id="m2Construido"
          class="form-input" 
          v-model="modelValue.m2Construido" 
          placeholder="Ej: 140"
          min="0"
          step="0.1"
        />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group half">
        <label for="claseConstruccion">Clase de Construcción</label>
        <select id="claseConstruccion" class="form-input" v-model="modelValue.claseConstruccion">
          <option value="A">A - Acero</option>
          <option value="B">B - Hormigón Armado</option>
          <option value="C">C - Albañilería de ladrillos</option>
          <option value="D">D - Albañilería de piedra/bloque</option>
          <option value="E">E - Madera</option>
          <option value="F">F - Adobe y madera</option>
          <option value="G">G - Prefabricada metálica/yeso</option>
          <option value="H">H - Prefabricada madera/yeso</option>
          <option value="I">I - Placas prefabricadas</option>
        </select>
      </div>
      <div class="form-group half">
        <label for="antiguedad">Antigüedad (Años)</label>
        <input 
          type="number" 
          id="antiguedad"
          class="form-input" 
          v-model="modelValue.antiguedad" 
          placeholder="Ej: 20"
          min="0"
          max="70"
          step="1"
        />
      </div>
    </div>

    <hr class="divider" />
    <h3 class="section-title">Valores de Mercado (UF)</h3>

    <div class="form-group">
      <label for="valorUfTerreno">Valor Promedio de Terreno del Sector (UF/m²)</label>
      <input 
        type="number" 
        id="valorUfTerreno"
        class="form-input" 
        v-model="modelValue.valorUfTerreno" 
        placeholder="Ej: 14.5"
        min="0"
        step="0.1"
      />
      <small class="hint">Basado en propiedades de referencia o tasaciones anteriores.</small>
    </div>

    <div class="form-group">
      <label for="valorBaseConstruccion">Valor Base de Construcción Nueva (UF/m²)</label>
      <input 
        type="number" 
        id="valorBaseConstruccion"
        class="form-input" 
        v-model="modelValue.valorBaseConstruccion" 
        placeholder="Ej: 18"
        min="0"
        step="0.1"
      />
      <small class="hint">Valor a depreciar por Chornik según clase y edad.</small>
    </div>

  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
});
</script>

<style scoped>
.form-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.half {
  flex: 1;
  min-width: 200px;
}

.divider {
  margin: 2rem 0;
  border: none;
  border-top: 1px solid var(--border);
}

.section-title {
  font-size: 1.125rem;
  margin-bottom: 1rem;
  color: var(--primary);
}

.hint {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

select.form-input {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748B%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
  background-repeat: no-repeat, repeat;
  background-position: right .7em top 50%, 0 0;
  background-size: .65em auto, 100%;
}
</style>
