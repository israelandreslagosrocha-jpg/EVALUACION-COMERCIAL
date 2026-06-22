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
          Sube un pantallazo de <strong>Portal Inmobiliario, TOCTOC, Yapo o Mercado Libre</strong>. La IA local leerá el texto del pantallazo y extraerá las características físicas y comerciales de inmediato.
        </p>

        <!-- Configuración de API Key de Gemini -->
        <div class="api-key-config">
          <details>
            <summary>🔑 Configurar API Key de Gemini (Opcional - Estructuración Inteligente)</summary>
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
                Si configuras tu API Key, Gemini refinará las direcciones y la descripción técnica extraída por el lector local.
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
                <p>{{ progressStatus }}</p>
                <span class="loading-detail">Procesando píxeles y analizando texto...</span>
              </div>

              <!-- Resultados de Extracción -->
              <div v-else-if="extractedData" class="extraction-results">
                <div class="results-header success-badge">
                  <span>✓ Datos Leídos Exitosamente</span>
                  <small>{{ isRealAi ? 'Gemini AI Refined' : 'Motor Local OCR (Tesseract)' }}</small>
                </div>

                <div class="results-grid">
                  <div class="form-group">
                    <label>Portal Origen</label>
                    <input type="text" class="form-input" v-model="extractedData.portal" />
                  </div>
                  <div class="form-group">
                    <label>Precio Publicación (UF o CLP)</label>
                    <input type="number" class="form-input highlight" v-model.number="extractedData.precio" />
                  </div>
                  <div class="form-group">
                    <label>m² Terreno</label>
                    <input type="number" class="form-input highlight" v-model.number="extractedData.superficie_terreno" />
                  </div>
                  <div class="form-group">
                    <label>m² Construidos</label>
                    <input type="number" class="form-input highlight" v-model.number="extractedData.superficie_construida" />
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
                    <label>Dirección Detectada</label>
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
                    <label>Resumen / Descripción de la Muestra</label>
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
const progressStatus = ref('Iniciando lector...');
const extractedData = ref(null);
const isRealAi = ref(false);

const geminiApiKey = ref('');
const showApiKey = ref(false);

onMounted(() => {
  geminiApiKey.value = localStorage.getItem('tasador_gemini_apikey') || '';
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

// DUAL-ENGINE OCR EXTRACTION: 
// 1. Run local Tesseract.js (free, offline, extracts raw text)
// 2. Parse text with Regex (local free fallback)
// 3. If Gemini API key is configured, send the raw text to Gemini for structured refinement
const runOcrExtraction = async (base64Image) => {
  loading.value = true;
  isRealAi.value = false;
  progressStatus.value = 'Lector OCR: Analizando imagen localmente...';

  const defaultUf = 39400;

  try {
    // Verificar si Tesseract está cargado globalmente
    if (typeof window.Tesseract === 'undefined') {
      throw new Error('Librería OCR local Tesseract no cargada. Por favor verifica tu conexión a internet.');
    }

    // Ejecutar Tesseract OCR en español ('spa')
    const resultOcr = await window.Tesseract.recognize(base64Image, 'spa', {
      logger: m => {
        if (m.status === 'recognizing text') {
          progressStatus.value = `Lector OCR: Escaneando texto (${Math.round(m.progress * 100)}%)`;
        }
      }
    });

    const rawText = resultOcr.data.text;
    console.log("Texto extraído por Tesseract OCR:", rawText);

    if (!rawText || rawText.trim().length === 0) {
      throw new Error('No se pudo detectar texto legible en el pantallazo.');
    }

    // 1. Aplicar análisis local inicial con expresiones regulares
    let parsedLocal = parseTextWithRegex(rawText, defaultUf);

    // 2. Si hay Gemini API Key configurada, refinar el texto crudo
    if (geminiApiKey.value) {
      progressStatus.value = 'IA Gemini: Estructurando y limpiando datos...';
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey.value}`;
        
        const prompt = `Analiza este bloque de texto extraído mediante un lector OCR desde una publicación inmobiliaria. 
Extrae las características de la propiedad y estructúralas estrictamente en un objeto JSON plano en español.

Texto OCR crudo:
"""
${rawText}
"""

El formato del JSON de salida debe ser exactamente el siguiente, no incluyas markdown ni texto extra en tu respuesta, solo el objeto JSON:
{
  "portal": "Identifica si es Portal Inmobiliario, TOCTOC, Yapo, Mercado Libre, etc.",
  "precio": 4500, // número entero o flotante del precio de la propiedad (si está en pesos o UF).
  "superficie_terreno": 300, // número en m² de superficie total/terreno.
  "superficie_construida": 120, // número en m² de superficie útil/construida.
  "dormitorios": 3, // número entero.
  "banos": 2, // número entero.
  "direccion": "Dirección exacta si aparece, sino calle/pasaje/avenida.",
  "comuna": "Comuna chilena detectada.",
  "descripcion": "Un resumen ejecutivo técnico y corto de la propiedad extraído de la descripción del texto."
}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        });

        if (response.ok) {
          const geminiResult = await response.json();
          const textResponse = geminiResult.candidates[0].content.parts[0].text;
          const cleanJsonStr = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsedGemini = JSON.parse(cleanJsonStr);

          // Sincronizar datos refinados por la IA
          extractedData.value = {
            portal: parsedGemini.portal || parsedLocal.portal,
            precio: Number(parsedGemini.precio) || parsedLocal.precio,
            superficie_terreno: Number(parsedGemini.superficie_terreno) || parsedLocal.superficie_terreno,
            superficie_construida: Number(parsedGemini.superficie_construida) || parsedLocal.superficie_construida,
            dormitorios: Number(parsedGemini.dormitorios) || parsedLocal.dormitorios,
            banos: Number(parsedGemini.banos) || parsedLocal.banos,
            direccion: parsedGemini.direccion || parsedLocal.direccion,
            comuna: parsedGemini.comuna || parsedLocal.comuna,
            descripcion: parsedGemini.descripcion || parsedLocal.descripcion,
            uf_dia: defaultUf
          };
          isRealAi.value = true;
        } else {
          throw new Error('Gemini API respondió con error');
        }
      } catch (geminiError) {
        console.warn("Fallo refinamiento Gemini, usando extracción local:", geminiError);
        extractedData.value = parsedLocal;
      }
    } else {
      // Usar directamente los datos extraídos localmente por Tesseract + Regex
      extractedData.value = parsedLocal;
    }

  } catch (error) {
    console.error("Error en flujo de extracción OCR:", error);
    alert(`Error de lectura: ${error.message || error}. Se cargarán datos semilla de prueba.`);
    loadMockData(defaultUf);
  } finally {
    loading.value = false;
  }
};

// Extractor local basado en Expresiones Regulares
const parseTextWithRegex = (text, defaultUf) => {
  const data = {
    portal: 'Portal Inmobiliario',
    precio: 0,
    superficie_terreno: 0,
    superficie_construida: 0,
    dormitorios: 0,
    banos: 0,
    direccion: 'Dirección no especificada',
    comuna: 'Teodoro Schmidt', // Default en base al cuadrante
    descripcion: '',
    uf_dia: defaultUf
  };

  // Reemplazar saltos de línea con espacios para búsquedas regex horizontales
  const singleLineText = text.replace(/\s+/g, ' ');

  // 1. Detectar Origen / Portal
  if (/toctoc/i.test(text)) data.portal = 'TOCTOC';
  else if (/yapo/i.test(text)) data.portal = 'Yapo';
  else if (/mercado\s*libre/i.test(text)) data.portal = 'Mercado Libre';

  // 2. Extraer Precio (UF o CLP)
  // UF 2.206 o 1.666,73 UF
  const ufRegex = /UF\s*([\d\.,]+)/i;
  const ufRegexRev = /([\d\.,]+)\s*UF/i;
  const clpRegex = /(?:\$|CLP)\s*([\d\.,]+)/i;

  const ufMatch = text.match(ufRegex) || text.match(ufRegexRev);
  if (ufMatch) {
    // Si contiene una coma y un punto, o solo puntos
    const cleanPrice = ufMatch[1].replace(/\./g, '').replace(',', '.');
    const val = parseFloat(cleanPrice);
    if (!isNaN(val)) data.precio = val;
  } else {
    const clpMatch = text.match(clpRegex);
    if (clpMatch) {
      const cleanPrice = clpMatch[1].replace(/\./g, '').replace(',', '.');
      const val = parseFloat(cleanPrice);
      if (!isNaN(val)) {
        // Si es mayor a 100.000, asumimos CLP y lo convertimos a UF
        if (val > 100000) {
          data.precio = Math.round(val / defaultUf);
        } else {
          data.precio = val;
        }
      }
    }
  }

  // 3. Extraer Metraje Terreno
  // "Superficie: 250.00 m²", "terreno de 180 m²", "superficie del terreno 250 m²"
  const terrenoRegex = /(?:superficie|terreno|total)[^\d]*([\d\.,]+)\s*(?:m²|m2|metros)/i;
  const terrMatch = singleLineText.match(terrenoRegex);
  if (terrMatch) {
    const val = parseFloat(terrMatch[1].replace(/\./g, '').replace(',', '.'));
    if (!isNaN(val)) data.superficie_terreno = val;
  }

  // 4. Extraer Metraje Construido
  // "Construidos: 85.00 m²", "109 m² construidos"
  const constRegex = /(?:construidos|util|útil|útiles)[^\d]*([\d\.,]+)\s*(?:m²|m2|metros)/i;
  const constMatch = singleLineText.match(constRegex);
  if (constMatch) {
    const val = parseFloat(constMatch[1].replace(/\./g, '').replace(',', '.'));
    if (!isNaN(val)) data.superficie_construida = val;
  }

  // 5. Dormitorios y Baños
  // "Dormitorios: 3" o "4 dormitorios"
  const dormRegex = /(\d+)\s*(?:dormitorio|habitacio)/i;
  const dormRegexRev = /(?:dormitorios|habitaciones)[^\d]*(\d+)/i;
  const dMatch = singleLineText.match(dormRegex) || singleLineText.match(dormRegexRev);
  if (dMatch) {
    data.dormitorios = parseInt(dMatch[1]);
  }

  // "Baños: 2" o "1 baño"
  const banoRegex = /(\d+)\s*(?:baño|bano)/i;
  const banoRegexRev = /(?:baños|banos)[^\d]*(\d+)/i;
  const bMatch = singleLineText.match(banoRegex) || singleLineText.match(banoRegexRev);
  if (bMatch) {
    data.banos = parseInt(bMatch[1]);
  }

  // 6. Buscar Comuna Común
  const comunas = ['Teodoro Schmidt', 'Curicó', 'Valparaíso', 'Santiago', 'Viña del Mar', 'Temuco', 'Concepción'];
  for (const c of comunas) {
    if (new RegExp(c, 'i').test(text)) {
      data.comuna = c;
      break;
    }
  }

  // 7. Extraer Dirección (Patrón: Nombre Calle + Número)
  // ej: "Manuel Rodríguez N.º 373" o "San José de la Dehesa 0240"
  const addressRegex = /([A-Z][a-záéíóúñ]+(?:\s+[A-Za-z][a-záéíóúñ]+)*)\s+(?:N[.°º#]|\bNo\b)?\s*(\d{2,5})/i;
  const addMatch = singleLineText.match(addressRegex);
  if (addMatch) {
    data.direccion = addMatch[0];
  }

  // Crear una descripción limpia basada en el texto leído
  data.descripcion = text.substring(0, 250).trim() + '...';

  return data;
};

const loadMockData = (defaultUf) => {
  extractedData.value = {
    portal: 'Portal Inmobiliario',
    precio: 2206,
    superficie_terreno: 250,
    superficie_construida: 85,
    dormitorios: 3,
    banos: 2,
    direccion: 'Manuel Rodríguez N.º 373',
    comuna: 'Teodoro Schmidt',
    descripcion: 'Casa nueva con excelentes terminaciones, ubicada en sector de Teodoro Schmidt, Araucanía. Terreno de 250 m² y construcción de 85 m².',
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
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px; /* Altura fija para el header */
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
  max-height: calc(85vh - 60px); /* Garantiza que quepa y haga scroll */
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
