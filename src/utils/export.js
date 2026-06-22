import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';
import { formatUF, formatCLP, formatNumber } from '../logic/calculations.js';

/**
 * Genera un PDF corporativo premium con diseño multipágina
 * 
 * @param {Object} data Datos de la tasación (cliente, propiedad, comparables, resultados, recomendación, agente)
 */
export const exportToPDF = (data) => {
  const { client, property, comparables, results, comment, recommendation, agent, valorUF } = data;
  
  // 1. Crear contenedor temporal para el informe PDF
  const printContainer = document.createElement('div');
  printContainer.id = 'premium-pdf-report';
  printContainer.style.position = 'absolute';
  printContainer.style.left = '-9999px';
  printContainer.style.top = '-9999px';
  printContainer.style.width = '8.5in'; // Ancho carta estándar
  printContainer.style.background = '#ffffff';
  printContainer.style.color = '#1E293B';
  printContainer.style.fontFamily = "'Inter', 'Helvetica Neue', Arial, sans-serif";
  printContainer.style.fontSize = '12px';
  printContainer.style.lineHeight = '1.5';

  const fechaReporte = new Date().toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const activeComps = comparables.filter(c => !c.descartado);
  const discardedComps = comparables.filter(c => c.descartado);

  // 2. Construir el HTML estructurado con saltos de página controlados por CSS
  printContainer.innerHTML = `
    <style>
      .pdf-page {
        box-sizing: border-box;
        padding: 0.8in 1in 0.8in 1in;
        height: 11in; /* Altura carta estándar */
        position: relative;
        page-break-after: always;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .pdf-page:last-child {
        page-break-after: avoid;
      }
      
      /* Cabecera & Pie de página comunes */
      .pdf-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #E2E8F0;
        padding-bottom: 8px;
        font-size: 8px;
        color: #64748B;
        text-transform: uppercase;
        margin-bottom: 20px;
      }
      .pdf-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid #E2E8F0;
        padding-top: 8px;
        font-size: 8px;
        color: #64748B;
        margin-top: 20px;
      }
      
      /* Página de Portada */
      .cover-page {
        justify-content: center;
        text-align: center;
        background: radial-gradient(circle at 10% 20%, #1e1b4b 0%, #312e81 90%);
        color: white;
      }
      .cover-logo {
        margin-bottom: 40px;
        color: #38BDF8;
      }
      .cover-title {
        font-size: 28px;
        font-weight: 800;
        margin-bottom: 10px;
        letter-spacing: -0.03em;
        line-height: 1.2;
        color: white;
      }
      .cover-subtitle {
        font-size: 14px;
        font-weight: 500;
        color: #94A3B8;
        margin-bottom: 80px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }
      .cover-details {
        margin: 0 auto;
        max-width: 480px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 24px;
        text-align: left;
        backdrop-filter: blur(4px);
      }
      .cover-details table {
        width: 100%;
        border-collapse: collapse;
      }
      .cover-details td {
        padding: 6px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        font-size: 11px;
      }
      .cover-details td:first-child {
        font-weight: 700;
        color: #38BDF8;
        width: 30%;
      }
      .cover-details td:last-child {
        color: white;
      }
      
      /* Contenido general */
      .pdf-section {
        flex: 1;
      }
      .pdf-title-sec {
        font-size: 16px;
        font-weight: 800;
        color: #1E3A8A;
        border-left: 4px solid #3B82F6;
        padding-left: 10px;
        margin-bottom: 15px;
        text-transform: uppercase;
      }
      
      /* Fichas técnicas */
      .data-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 20px;
      }
      .data-card {
        border: 1px solid #E2E8F0;
        border-radius: 8px;
        padding: 12px 16px;
        background: #F8FAFC;
      }
      .data-card h4 {
        margin: 0 0 10px 0;
        color: #1E293B;
        font-size: 11px;
        text-transform: uppercase;
        border-bottom: 2px solid #3B82F6;
        padding-bottom: 4px;
      }
      .data-table {
        width: 100%;
      }
      .data-table td {
        padding: 4px 0;
        font-size: 10px;
      }
      .data-table td:first-child {
        font-weight: 700;
        color: #64748B;
        width: 40%;
      }
      
      /* Comentarios */
      .comment-box {
        background: #EFF6FF;
        border-left: 4px solid #3B82F6;
        padding: 12px;
        border-radius: 4px;
        font-size: 10px;
        margin-top: 15px;
        white-space: pre-line;
      }
      
      /* Tablas de Comparables */
      .report-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
      }
      .report-table th {
        background: #1E3A8A;
        color: white;
        font-size: 8px;
        font-weight: 700;
        padding: 6px;
        border: 1px solid #1E3A8A;
        text-transform: uppercase;
      }
      .report-table td {
        padding: 6px;
        font-size: 8px;
        border: 1px solid #E2E8F0;
      }
      .report-table tr:nth-child(even) {
        background: #F8FAFC;
      }
      
      /* Bloques de Resultados */
      .result-banner {
        background: linear-gradient(135deg, #1E1B4B, #312E81);
        color: white;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        margin-bottom: 20px;
      }
      .result-banner h2 {
        margin: 0;
        font-size: 24px;
        font-weight: 900;
      }
      .result-banner span {
        font-size: 12px;
        color: #94A3B8;
      }
      .result-subgrid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-top: 10px;
      }
      .result-subbox {
        background: rgba(255, 255, 255, 0.05);
        padding: 10px;
        border-radius: 6px;
      }
      .result-subbox strong {
        font-size: 12px;
      }
      .result-subbox span {
        font-size: 8px;
        display: block;
      }

      /* Trazabilidad */
      .trace-item {
        margin-bottom: 10px;
        background: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 6px;
        padding: 10px;
      }
      .trace-item strong {
        display: block;
        font-size: 9px;
        color: #1e3a8a;
      }
      .trace-item span {
        font-size: 9px;
        font-family: monospace;
        white-space: pre-line;
      }
      
      /* Firmas */
      .signature-area {
        display: flex;
        justify-content: flex-end;
        margin-top: 50px;
      }
      .signature-box {
        border-top: 1px solid #94A3B8;
        width: 200px;
        text-align: center;
        padding-top: 8px;
        font-size: 10px;
      }
    </style>

    <!-- PÁGINA 1: PORTADA -->
    <div class="pdf-page cover-page">
      <div class="cover-logo">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
      </div>
      <h1 class="cover-title">INFORME DE EVALUACIÓN COMERCIAL</h1>
      <div class="cover-subtitle">Tasación Inmobiliaria Técnica</div>
      
      <div class="cover-details">
        <table>
          <tr>
            <td>Propiedad:</td>
            <td>${property.direccion}, ${property.comuna}</td>
          </tr>
          <tr>
            <td>Propietario:</td>
            <td>${client.nombre}</td>
          </tr>
          <tr>
            <td>RUT Cliente:</td>
            <td>${client.rut || '—'}</td>
          </tr>
          <tr>
            <td>Fecha Emisión:</td>
            <td>${fechaReporte}</td>
          </tr>
          <tr>
            <td>Valor UF aplicado:</td>
            <td>${formatCLP(valorUF)}</td>
          </tr>
          <tr>
            <td>Tasador Responsable:</td>
            <td>${agent || 'Ximena Torres'}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- PÁGINA 2: ANTECEDENTES Y FICHA TÉCNICA -->
    <div class="pdf-page">
      <div class="pdf-header">
        <span>Evaluación Comercial GP</span>
        <span>Antecedentes Técnicos</span>
      </div>
      
      <div class="pdf-section">
        <h3 class="pdf-title-sec">Antecedentes Generales</h3>
        
        <div class="data-grid">
          <div class="data-card">
            <h4>Ficha del Propietario</h4>
            <table class="data-table">
              <tr><td>Nombre:</td><td>${client.nombre}</td></tr>
              <tr><td>RUT:</td><td>${client.rut || '—'}</td></tr>
              <tr><td>Teléfono:</td><td>${client.telefono || '—'}</td></tr>
              <tr><td>Email:</td><td>${client.email || '—'}</td></tr>
              <tr><td>Dirección:</td><td>${client.direccion || '—'}</td></tr>
            </table>
          </div>
          
          <div class="data-card">
            <h4>Características del Inmueble</h4>
            <table class="data-table">
              <tr><td>Ubicación:</td><td>${property.direccion}, ${property.comuna}</td></tr>
              <tr><td>Rol SII:</td><td>${property.rol_sii || '—'}</td></tr>
              <tr><td>Sup. Terreno:</td><td>${formatNumber(property.superficie_terreno)} m²</td></tr>
              <tr><td>Sup. Construido:</td><td>${formatNumber(property.superficie_construida)} m²</td></tr>
              <tr><td>Clase (SII):</td><td>Clase ${property.clase_construccion}</td></tr>
              <tr><td>Calidad (SII):</td><td>Grado ${property.calidad_construccion}</td></tr>
              <tr><td>Antigüedad:</td><td>Real: ${property.antiguedad_real}a | Aparente: ${property.antiguedad_aparente}a</td></tr>
            </table>
          </div>
        </div>
        
        <h3 class="pdf-title-sec" style="margin-top:20px;">Consideraciones Técnicas del Tasador</h3>
        <div class="comment-box">
          ${comment || 'No se registraron comentarios técnicos adicionales.'}
        </div>
      </div>
      
      <div class="pdf-footer">
        <span>Informe Confidencial</span>
        <span>Página 2 de 4</span>
      </div>
    </div>

    <!-- PÁGINA 3: ESTUDIO DE MERCADO Y COMPARABLES -->
    <div class="pdf-page">
      <div class="pdf-header">
        <span>Evaluación Comercial GP</span>
        <span>Estudio de Mercado</span>
      </div>

      <div class="pdf-section">
        <h3 class="pdf-title-sec">Muestreo de Comparables Aceptados</h3>
        <p style="font-size:9px; color:#64748B; margin-top:-10px; margin-bottom:10px;">
          Se analizó la oferta de propiedades usadas similares en el sector para inferir el valor residual de suelo.
        </p>

        <table class="report-table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Portal</th>
              <th>Precio Public. (UF)</th>
              <th>m² Terr.</th>
              <th>m² Const.</th>
              <th>Clase/Cal/Edad</th>
              <th>UF/m² Const. Depr</th>
              <th>Valor Const. (UF)</th>
              <th>UF/m² Suelo Res.</th>
            </tr>
          </thead>
          <tbody>
            ${
              activeComps.map((c, i) => `
                <tr>
                  <td>Ref. ${String(i + 1).padStart(2, '0')}</td>
                  <td>${c.portal_origen || 'Portal'}</td>
                  <td>${c.precio_publicacion} UF</td>
                  <td>${c.superficie_terreno} m²</td>
                  <td>${c.superficie_construida} m²</td>
                  <td>${c.clase}${c.calidad} - ${c.antiguedad}a</td>
                  <td>${c.calc.constDepreciadaUFm2.toFixed(2)}</td>
                  <td>${c.calc.constValorTotalUF.toFixed(0)} UF</td>
                  <td style="font-weight:700; color:#059669;">${c.calc.terrenoResidualUFm2.toFixed(2)} UF</td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>

        ${discardedComps.length > 0 ? `
          <h3 class="pdf-title-sec" style="margin-top:25px;">Muestras Descartadas / Outliers</h3>
          <table class="report-table">
            <thead>
              <tr>
                <th>Comparable</th>
                <th>Precio</th>
                <th>Ubicación</th>
                <th>Justificación del Descarte</th>
              </tr>
            </thead>
            <tbody>
              ${
                discardedComps.map((c) => `
                  <tr style="background:#FFF5F5;">
                    <td style="color:#B91C1C; font-weight:700;">${c.portal_origen || 'Muestra'}</td>
                    <td>${c.precio_publicacion} UF</td>
                    <td>${c.direccion || '—'}, ${c.comuna}</td>
                    <td style="color:#991B1B; font-style:italic;">${c.justificacion}</td>
                  </tr>
                `).join('')
              }
            </tbody>
          </table>
        ` : ''}

        <div class="data-card mt-3" style="background:#F1F5F9; border-color:#CBD5E1; margin-top:20px;">
          <h4 style="border-bottom-color:#64748B;">Resumen del Análisis de Muestreo</h4>
          <table class="data-table">
            <tr>
              <td>Promedio de Suelo Ponderado obtenido de la muestra:</td>
              <td style="font-size:12px; font-weight:800; color:#1E3A8A; text-align:right;">
                ${results.valorUfTerreno.toFixed(2)} UF/m²
              </td>
            </tr>
            <tr>
              <td>Desviación Estándar de la Muestra:</td>
              <td style="text-align:right;">± ${results.stdDev ? results.stdDev.toFixed(2) : '0.00'} UF/m²</td>
            </tr>
          </table>
        </div>
      </div>

      <div class="pdf-footer">
        <span>Informe Confidencial</span>
        <span>Página 3 de 4</span>
      </div>
    </div>

    <!-- PÁGINA 4: RESULTADOS, TRAZABILIDAD Y FIRMA -->
    <div class="pdf-page">
      <div class="pdf-header">
        <span>Evaluación Comercial GP</span>
        <span>Tasación Final y Trazabilidad</span>
      </div>

      <div class="pdf-section">
        <h3 class="pdf-title-sec">Resultados de la Tasación</h3>
        
        <div class="result-banner">
          <span>Valor Comercial Estimado (Probable)</span>
          <h2>${formatCLP(results.valorProbableCLP)}</h2>
          <strong style="font-size: 16px;">${formatUF(results.valorProbableUF)}</strong>
          
          <div class="result-subgrid">
            <div class="result-subbox">
              <span>Valor Mínimo (-5%)</span>
              <strong>${formatUF(results.valorMinimoUF)}</strong>
            </div>
            <div class="result-subbox">
              <span>Valor Probable</span>
              <strong>${formatUF(results.valorProbableUF)}</strong>
            </div>
            <div class="result-subbox">
              <span>Valor Máximo (+5%)</span>
              <strong>${formatUF(results.valorMaximoUF)}</strong>
            </div>
          </div>
        </div>

        <h3 class="pdf-title-sec">Memoria de Cálculo y Trazabilidad</h3>
        <div>
          ${
            results.trace.map(t => `
              <div class="trace-item">
                <strong>${t.titulo}</strong>
                <span>${t.descripcion}</span>
              </div>
            `).join('')
          }
        </div>

        ${recommendation ? `
          <h3 class="pdf-title-sec" style="margin-top:15px;">Recomendación Comercial</h3>
          <div class="comment-box" style="background:#F0FDF4; border-left-color:#10B981;">
            ${recommendation}
          </div>
        ` : ''}

        <div class="signature-area">
          <div class="signature-box">
            <br/><br/><br/>
            <strong>${agent || 'Ximena Torres'}</strong><br/>
            <span>Agente Inmobiliario / Tasador</span>
          </div>
        </div>
      </div>

      <div class="pdf-footer">
        <span>Informe Confidencial</span>
        <span>Página 4 de 4</span>
      </div>
    </div>
  `;

  // 3. Agregar el contenedor al documento
  document.body.appendChild(printContainer);

  // 4. Configuración de html2pdf.js
  const opt = {
    margin:       0, // El margen se gestiona a nivel de CSS
    filename:     `Tasacion_Comercial_${client.nombre.replace(/\s+/g, '_')}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { 
      scale: 2, 
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  // 5. Ejecutar la descarga y eliminar el contenedor temporal
  html2pdf().set(opt).from(printContainer).save().then(() => {
    document.body.removeChild(printContainer);
  }).catch(err => {
    console.error("Error al generar PDF:", err);
    if (document.getElementById('premium-pdf-report')) {
      document.body.removeChild(printContainer);
    }
  });
};

/**
 * Exporta los resultados básicos a una planilla Excel (.xlsx) estructurada
 */
export const exportToExcel = (data) => {
  const { client, property, results } = data;
  
  const worksheetData = [
    { Sección: 'CLIENTE', Parámetro: 'Nombre', Valor: client.nombre },
    { Sección: 'CLIENTE', Parámetro: 'RUT', Valor: client.rut || '' },
    { Sección: 'PROPIEDAD', Parámetro: 'Dirección', Valor: property.direccion },
    { Sección: 'PROPIEDAD', Parámetro: 'Comuna', Valor: property.comuna },
    { Sección: 'PROPIEDAD', Parámetro: 'ROL SII', Valor: property.rol_sii || '' },
    { Sección: 'FISICO', Parámetro: 'Sup. Terreno (m²)', Valor: results.m2Terreno },
    { Sección: 'FISICO', Parámetro: 'Sup. Construido (m²)', Valor: results.m2Construido },
    { Sección: 'CÁLCULOS', Parámetro: 'Valor Suelo (UF/m²)', Valor: results.valorUfTerreno },
    { Sección: 'CÁLCULOS', Parámetro: 'Valor Const. Depreciado (UF/m²)', Valor: results.constDepreciadaUFm2 },
    { Sección: 'TASACIÓN', Parámetro: 'Valor Terreno (UF)', Valor: results.totalTerrenoUF },
    { Sección: 'TASACIÓN', Parámetro: 'Valor Construcción (UF)', Valor: results.totalConstruccionUF },
    { Sección: 'TASACIÓN', Parámetro: 'Valor Obras Comp. (UF)', Valor: results.totalObrasUF },
    { Sección: 'TASACIÓN', Parámetro: 'Valor Total Tasación (UF)', Valor: results.totalTasacionUF },
    { Sección: 'RANGOS', Parámetro: 'Valor Mínimo (UF)', Valor: results.valorMinimoUF },
    { Sección: 'RANGOS', Parámetro: 'Valor Probable (UF)', Valor: results.valorProbableUF },
    { Sección: 'RANGOS', Parámetro: 'Valor Máximo (UF)', Valor: results.valorMaximoUF }
  ];

  const ws = XLSX.utils.json_to_sheet(worksheetData);
  
  // Agregar un ancho de columna básico para legibilidad
  ws['!cols'] = [
    { wch: 15 },
    { wch: 30 },
    { wch: 40 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tasación Comercial");
  
  const filename = `Tasacion_Comercial_${client.nombre.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
};
