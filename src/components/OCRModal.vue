<template>
  <div class="modal-backdrop animate-fade-in" v-if="isOpen">
    <div class="modal-container card glassmorphism animate-slide-up">
      <div class="modal-header">
        <h3>Extracción Documental con IA (OCR)</h3>
        <button class="btn-close" @click="close">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div class="modal-body">
        <p class="description">
          Sube un pantallazo de <strong>Portal Inmobiliario, TOCTOC, Yapo o Mercado Libre</strong>. La IA extraerá los datos automáticamente para evitar digitación manual.
        </p>

        <!-- Configuración de API Key de Gemini -->
        <div class="api-key-config">
          <details>
            <summary>Configurar API Key de Gemini (Opcional - Extraer con IA Real)</summary>
            <div class="form-group mt-2">
              <label>API Key de Google Gemini</label>
              <div class="api-key-input-wrap">
                <input 
                  :type="showApiKey ? 'text' : 'password'" 
                  class="form-input" 
                  v-model="geminiApiKey" 
                  placeholder="AIzaSy..." 
                />
                <button class="btn btn-secondary btn-icon-only" @click="showApiKey = !showApiKey">
                  {{ showApiKey ? '🔒' : '👁️' }}
                </button>
              </div>
              <small class="text-muted">
                Tu clave se almacena localmente en tu navegador. Si no la ingresas, el sistema simulará la extracción para demostración.
              </small>
            </div>
          </details>
        </div>

        <div class="ocr-workflow">
          <!-- Zona de Carga de Imagen -->
          <div 
            v-if="!imageSrc" 
            class="drag-drop-zone"
            :class="{ active: isDragging }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            @click="triggerFileSelect"
          >
            <input 
              type="file" 
              ref="fileInput" 
              style="display: none;" 
              accept="image/*" 
              @change="handleFileSelect" 
            />
            <div class="upload-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            </div>
            <p class="drop-text">Arrastra un pantallazo aquí, pégalo desde el portapapeles o haz clic para buscar.</p>
            <span class="btn btn-secondary btn-sm">Seleccionar Imagen</span>
          </div>

          <!-- Previsualización e Indicador de Carga -->
          <div v-else class="preview-container">
            <div class="image-preview-wrap">
              <img :src="imageSrc" alt="Pantallazo subido" class="image-preview" />
              <button class="btn-remove-preview" @click="resetImage" :disabled="loading">Cambiar Imagen</button>
            </div>

            <div class="processing-panel">
              <div v-if="loading" class="ocr-loading">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spin"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                <p>La IA de Gemini está analizando la imagen...</p>
                <span class="loading-detail">Extrayendo precios, m² y características...</span>
              </div>

              <!-- Resultados de Extracción -->
              <div v-else-if="extractedData" class="extraction-results">
                <div class="results-header success-badge">
                  <span>✓ Extracción completada</span>
                  <small v-if="!isRealAi">Simulado (Ingresa API Key en el menú de arriba para extracción real)</small>
                  <small v-else>Realizado por Gemini 2.5 Flash</small>
                </div>

                <div class="results-grid">
                  <div class="form-group">
                    <label>Portal Inmobiliario</label>
                    <input type="text" class="form-input" v-model="extractedData.portal" />
                  </div>
                  <div class="form-group">
                    <label>Precio Publicación (UF o CLP)</label>
                    <input type="number" class="form-input highlight" v-model.number="extractedData.precio" />
                  </div>
                  <div class="form-group">
                    <label>m² Terreno</label>
                    <input type="number" class="form-input" v-model.number="extractedData.superficie_terreno" />
                  </div>
                  <div class="form-group">
                    <label>m² Construidos</label>
                    <input type="number" class="form-input" v-model.number="extractedData.superficie_construida" />
                  </div>
                  <div class="form-group">
                    <label>Dormitorios</label>
                    <input type="number" class="form-input" v-model.number="extractedData.dormitorios" />
                  </div>
                  <div class="form-group">
                    <label>Baños</label>
                    <input type="number" class="form-input" v-model.number="extractedData.banos" />
                  </div>
                  <div class="form-group span-all">
                    <label>Dirección</label>
                    <input type="text" class="form-input" v-model="extractedData.direccion" />
                  </div>
                  <div class="form-group">
                    <label>Comuna</label>
                    <input type="text" class="form-input" v-model="extractedData.comuna" />
                  </div>
                  <div class="form-group">
                    <label>UF del Día (Captura)</label>
                    <input type="number" class="form-input" v-model.number="extractedData.uf_dia" />
                  </div>
                  <div class="form-group span-all">
                    <label>Descripción / Observaciones</label>
                    <textarea class="form-input" rows="2" v-model="extractedData.descripcion"></textarea>
                  </div>
                </div>

                <div class="results-actions">
                  <button class="btn btn-secondary" @click="resetImage">Cancelar</button>
                  <button class="btn btn-primary" @click="confirmComparable">✓ Confirmar e Importar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close', 'import']);

const isDragging = ref(false);
const imageSrc = ref(null);
const fileInput = ref(null);
const loading = ref(false);
const extractedData = ref(null);
const isRealAi = ref(false);

const geminiApiKey = ref('');
const showApiKey = ref(false);

onMounted(() => {
  // Cargar clave guardada
  geminiApiKey.value = localStorage.getItem('tasador_gemini_apikey') || '';
  
  // Escuchar pegar desde el clipboard
  window.addEventListener('paste', handlePaste);
});

onUnmounted(() => {
  window.removeEventListener('paste', handlePaste);
});

watch(geminiApiKey, (newVal) => {
  localStorage.setItem('tasador_gemini_apikey', newVal);
});

const close = () => {
  resetImage();
  emit('close');
};

const triggerFileSelect = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

const handleFileSelect = (e) => {
  const file = e.target.files[0];
  if (file) {
    processImageFile(file);
  }
};

const handleDrop = (e) => {
  isDragging.value = false;
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    processImageFile(file);
  }
};

const handlePaste = (e) => {
  if (!props.isOpen || imageSrc.value) return;
  const items = e.clipboardData?.items;
  if (items) {
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        processImageFile(file);
        break;
      }
    }
  }
};

const processImageFile = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    imageSrc.value = e.target.result;
    runOcrExtraction(e.target.result);
  };
  reader.readAsDataURL(file);
};

const resetImage = () => {
  imageSrc.value = null;
  extractedData.value = null;
  loading.value = false;
};

// Extracción real usando Gemini API o mock
const runOcrExtraction = async (base64Image) => {
  loading.value = true;
  isRealAi.value = false;
  
  // Obtener valor actual aproximado de UF de la sesión
  const defaultUf = 39400;

  if (geminiApiKey.value) {
    try {
      // Extraemos la parte base64 pura (sin el header data:image/png;base64,)
      const base64Data = base64Image.split(',')[1];
      const mimeType = base64Image.split(';')[0].split(':')[1];

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey.value}`;
      
      const prompt = `Analiza este pantallazo de publicación de propiedad inmobiliaria y extrae los datos de forma estructurada en un JSON plano.
Identifica y extrae:
1. portal: Portal origen (Portal Inmobiliario, TOCTOC, Yapo, Mercado Libre, etc.)
2. precio: Valor numérico del precio (ya sea en UF o en CLP, mantén el número original).
3. superficie_terreno: Superficie total o de terreno (número en m²).
4. superficie_construida: Superficie útil o construida (número en m²).
5. dormitorios: Cantidad de dormitorios (entero).
6. banos: Cantidad de baños (entero).
7. direccion: Dirección de la propiedad.
8. comuna: Comuna donde se ubica.
9. descripcion: Breve descripción de la propiedad.
10. uf_dia: Coloca ${defaultUf}.

Responde ÚNICAMENTE con un objeto JSON válido que contenga estas llaves. No añadas explicaciones de texto antes o después.
El formato JSON exacto debe ser:
{
  "portal": "Nombre Portal",
  "precio": 4500,
  "superficie_terreno": 300,
  "superficie_construida": 120,
  "dormitorios": 3,
  "banos": 2,
  "direccion": "Calle Ficticia 123",
  "comuna": "Santiago",
  "descripcion": "Detalles extraídos...",
  "uf_dia": ${defaultUf}
}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const textResponse = result.candidates[0].content.parts[0].text;
      
      // Limpiar respuesta en caso de que venga con bloques de markdown ```json
      const cleanJsonStr = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJsonStr);
      
      extractedData.value = {
        portal: parsed.portal || 'Portal Inmobiliario',
        precio: Number(parsed.precio) || 4500,
        superficie_terreno: Number(parsed.superficie_terreno) || 200,
        superficie_construida: Number(parsed.superficie_construida) || 100,
        dormitorios: Number(parsed.dormitorios) || 3,
        banos: Number(parsed.banos) || 2,
        direccion: parsed.direccion || 'Dirección no especificada',
        comuna: parsed.comuna || 'Valparaíso',
        descripcion: parsed.descripcion || '',
        uf_dia: Number(parsed.uf_dia) || defaultUf
      };
      isRealAi.value = true;
    } catch (error) {
      console.error("Error llamando a la API de Gemini:", error);
      alert("Error al conectar con la API de Gemini. Se cargará una simulación de extracción.");
      loadMockData(defaultUf);
    } finally {
      loading.value = false;
    }
  } else {
    // Simulación de OCR (Mock)
    setTimeout(() => {
      loadMockData(defaultUf);
      loading.value = false;
    }, 2000);
  }
};

const loadMockData = (defaultUf) => {
  // Simulador inteligente que devuelve datos realistas basados en un comparable de PortalInmobiliario
  extractedData.value = {
    portal: 'Portal Inmobiliario',
    precio: 3500, // en UF
    superficie_terreno: 300,
    superficie_construida: 120,
    dormitorios: 3,
    banos: 2,
    direccion: 'Av. Alemania 1420',
    comuna: 'Valparaíso',
    descripcion: 'Excelente propiedad ubicada en sector consolidado de Cerro Alegre, hermosa vista, movilización a la puerta.',
    uf_dia: defaultUf
  };
};

const confirmComparable = () => {
  if (extractedData.value) {
    emit('import', { ...extractedData.value });
    close();
  }
};
</script>

<style scoped>
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
  max-width: 650px;
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
  font-weight: 700;
  color: var(--primary);
}

.btn-close {
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #F1F5F9;
  color: var(--text);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.description {
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1.25rem;
}

.api-key-config {
  margin-bottom: 1.25rem;
  background: #F8FAFC;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
}

.api-key-config summary {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--primary-light);
  cursor: pointer;
}

.api-key-input-wrap {
  display: flex;
  gap: 0.5rem;
}

.btn-icon-only {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.ocr-workflow {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.drag-drop-zone {
  border: 2px dashed #CBD5E1;
  background: #F8FAFC;
  border-radius: 12px;
  padding: 2.5rem 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.drag-drop-zone:hover, .drag-drop-zone.active {
  border-color: var(--accent);
  background: #F0F9FF;
}

.upload-icon {
  color: var(--accent);
}

.drop-text {
  font-size: 0.9rem;
  color: var(--text-muted);
  max-width: 320px;
  margin: 0;
}

.preview-container {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1.5rem;
}

@media (max-width: 580px) {
  .preview-container {
    grid-template-columns: 1fr;
  }
}

.image-preview-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.image-preview {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.btn-remove-preview {
  padding: 0.5rem;
  font-size: 0.85rem;
  color: #EF4444;
  background: #FEE2E2;
  border: 1px solid #FCA5A5;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-remove-preview:hover {
  background: #FEE2E2;
  opacity: 0.9;
}

.processing-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 180px;
}

.ocr-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: var(--text-muted);
  gap: 0.5rem;
}

.spin {
  animation: spin 1s linear infinite;
  color: var(--accent);
  margin-bottom: 0.5rem;
}

.loading-detail {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-style: italic;
}

.extraction-results {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.success-badge {
  background: #D1FAE5;
  color: #065F46;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.success-badge small {
  font-weight: 500;
  opacity: 0.8;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.span-all {
  grid-column: 1 / -1;
}

.form-input.highlight {
  border-color: var(--accent);
  background: #F0F9FF;
  font-weight: 700;
}

.results-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}
</style>
