import { obtenerValorConstruccion } from './chornik.js';

/**
 * Calcula el valor residual del terreno para un comparable específico.
 * 
 * @param {Object} comp Objeto comparable
 * @returns {Object} Detalle de los cálculos residuales
 */
export function calculateComparableResidualTerrain(comp) {
  const precioPublicacion = Number(comp.precio_publicacion) || 0;
  const ufDia = Number(comp.uf) || 1; // Valor de la UF a la fecha de captura
  
  // Si el precio está en CLP (mayor a 100.000 de forma heurística), convertir a UF
  let precioPublicacionUF = precioPublicacion;
  if (precioPublicacion > 100000) {
    precioPublicacionUF = precioPublicacion / ufDia;
  }

  // 1. Estimar precio de venta real aplicando un 5% de descuento por negociación/publicación
  const precioVentaUF = precioPublicacionUF * 0.95;

  // 2. Estimar valor de construcción depreciada usando Chornik
  const m2Construido = Number(comp.superficie_construida) || 0;
  const m2Terreno = Number(comp.superficie_terreno) || 1; // Evitar división por cero
  
  // Calculamos UF/m2 depreciado para la clase, calidad y antigüedad del comparable
  const constDepreciadaUFm2 = obtenerValorConstruccion(
    comp.clase,
    comp.calidad,
    comp.antiguedad
  );

  const constValorTotalUF = m2Construido * constDepreciadaUFm2;

  // 3. Valor de Terreno Residual = Precio Venta - Construcción
  const terrenoResidualTotalUF = Math.max(0, precioVentaUF - constValorTotalUF);
  const terrenoResidualUFm2 = m2Terreno > 0 ? terrenoResidualTotalUF / m2Terreno : 0;

  return {
    precioPublicacionUF,
    precioVentaUF,
    constDepreciadaUFm2,
    constValorTotalUF,
    terrenoResidualTotalUF,
    terrenoResidualUFm2
  };
}

/**
 * Realiza el análisis estadístico de una lista de comparables.
 * Detecta y marca outliers, calcula promedios y desviación estándar.
 * 
 * @param {Array} comparables Lista de comparables
 * @returns {Object} Resultados estadísticos y comparables procesados
 */
export function analyzeMarketComparables(comparables) {
  if (!Array.isArray(comparables) || comparables.length === 0) {
    return {
      comparablesCalculados: [],
      averages: { terrenoPromedio: 0, constructionPromedio: 0, stdDev: 0, ponderadoTerreno: 0 },
      outliersCount: 0
    };
  }

  // 1. Calcular valores residuales para todos los comparables
  const calculated = comparables.map(comp => {
    const calc = calculateComparableResidualTerrain(comp);
    return {
      ...comp,
      calc
    };
  });

  // 2. Filtrar comparables válidos (con terreno residual positivo y datos completos)
  const validComps = calculated.filter(c => 
    c.calc.terrenoResidualUFm2 > 0 && 
    Number(c.superficie_terreno) > 0 &&
    Number(c.superficie_construida) > 0
  );

  if (validComps.length === 0) {
    return {
      comparablesCalculados: calculated,
      averages: { terrenoPromedio: 0, constructionPromedio: 0, stdDev: 0, ponderadoTerreno: 0 },
      outliersCount: 0
    };
  }

  // 3. Calcular Promedio Simple inicial y Desviación Estándar de la muestra
  const terrainValues = validComps.map(c => c.calc.terrenoResidualUFm2);
  const sum = terrainValues.reduce((acc, val) => acc + val, 0);
  const mean = sum / terrainValues.length;

  const variance = terrainValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / terrainValues.length;
  const stdDev = Math.sqrt(variance);

  // 4. Identificar Outliers (ej: más de 1.5 desviaciones estándar o residuales extremadamente bajos)
  let outliersCount = 0;
  const processed = calculated.map(comp => {
    let outlier = false;
    let justificacion = '';
    
    const value = comp.calc.terrenoResidualUFm2;
    
    if (value <= 0) {
      outlier = true;
      justificacion = 'Descartado: Valor residual del terreno es negativo o cero (el costo de construcción supera el valor de venta estimado).';
    } else if (validComps.length >= 3) {
      // Solo descartamos por desviación estándar si hay suficientes muestras
      const dev = Math.abs(value - mean);
      if (dev > 1.5 * stdDev) {
        outlier = true;
        outliersCount++;
        justificacion = `Descartado: Outlier extremo detectado estadísticamente. Valor de ${value.toFixed(2)} UF/m² se aleja significativamente del promedio de la muestra (${mean.toFixed(2)} ± ${(1.5 * stdDev).toFixed(2)} UF/m²).`;
      }
    }

    // El usuario también puede forzar un descarte manual, respetamos eso
    const isDescartado = comp.descartado_manual !== undefined ? comp.descartado_manual : outlier;
    const finalJustificacion = comp.justificacion_manual || justificacion || (isDescartado ? 'Descartado por análisis estadístico.' : 'Aceptable.');

    return {
      ...comp,
      outlier,
      descartado: isDescartado,
      justificacion: finalJustificacion
    };
  });

  // 5. Calcular promedios finales excluyendo los descartados
  const activeComps = processed.filter(c => !c.descartado && c.calc.terrenoResidualUFm2 > 0);
  
  let terrenoPromedio = 0;
  let constructionPromedio = 0;
  let ponderadoTerreno = 0;

  if (activeComps.length > 0) {
    // Promedio simple del terreno
    const activeTerrainSum = activeComps.reduce((acc, c) => acc + c.calc.terrenoResidualUFm2, 0);
    terrenoPromedio = activeTerrainSum / activeComps.length;

    // Promedio simple de construcción depreciada
    const activeConstSum = activeComps.reduce((acc, c) => acc + c.calc.constDepreciadaUFm2, 0);
    constructionPromedio = activeConstSum / activeComps.length;

    // Promedio ponderado (por defecto pondera por similitud si existe, o peso simple)
    // Similitud/Peso: Alto = 3, Medio = 2, Bajo = 1
    let totalWeight = 0;
    let weightedSum = 0;
    activeComps.forEach(c => {
      const weight = Number(c.peso) || 2; // Default a peso medio (2)
      totalWeight += weight;
      weightedSum += c.calc.terrenoResidualUFm2 * weight;
    });
    ponderadoTerreno = totalWeight > 0 ? weightedSum / totalWeight : terrenoPromedio;
  }

  return {
    comparablesCalculados: processed,
    averages: {
      terrenoPromedio,
      constructionPromedio,
      stdDev,
      ponderadoTerreno
    },
    outliersCount
  };
}

/**
 * Calcula la tasación comercial completa.
 * 
 * @param {Object} inputs Formulario de tasación
 * @param {Array} activeComparables Comparables de mercado utilizados
 * @param {Array} complementaryWorks Obras complementarias agregadas
 * @returns {Object} Resultados completos y trazabilidad de cálculos
 */
export function calculateAppraisal(inputs, activeComparables = [], complementaryWorks = []) {
  const m2Terreno = Number(inputs.m2Terreno) || 0;
  const m2Construido = Number(inputs.m2Construido) || 0;
  const claseConstruccion = inputs.claseConstruccion || 'C';
  const calidadConstruccion = Number(inputs.calidadConstruccion) || 3;
  const antiguedad = Number(inputs.antiguedad) || 0;
  const valorUF = Number(inputs.valorUF) || 38000;
  
  // Si el usuario especifica un valor base de construcción manualmente, lo usamos; si no, lookup
  const valorBaseConstruccionOverride = inputs.valorBaseConstruccionOverride ? Number(inputs.valorBaseConstruccionOverride) : null;

  // 1. Obtener Valor UF/m2 Terreno a aplicar
  // Si hay comparables y no se ha sobreescrito a mano, usamos el promedio ponderado o simple
  let valorUfTerreno = Number(inputs.valorUfTerreno);
  if (isNaN(valorUfTerreno) || valorUfTerreno <= 0) {
    const analysis = analyzeMarketComparables(activeComparables);
    valorUfTerreno = analysis.averages.ponderadoTerreno || analysis.averages.terrenoPromedio || 10.0; // Fallback
  }

  // 2. Cálculo de Terreno
  const totalTerrenoUF = m2Terreno * valorUfTerreno;

  // 3. Cálculo de Construcción Original usando Chornik
  const constDepreciadaUFm2 = obtenerValorConstruccion(
    claseConstruccion,
    calidadConstruccion,
    antiguedad,
    valorBaseConstruccionOverride
  );
  const totalConstruccionUF = m2Construido * constDepreciadaUFm2;

  // 4. Cálculo de Obras Complementarias
  let totalObrasUF = 0;
  const processedWorks = (complementaryWorks || []).map(work => {
    const superficie = Number(work.superficie) || 0;
    const valorBaseUF = Number(work.valorBaseUF) || 0;
    const depreciacion = Number(work.depreciacion) || 0; // % de depreciación (0 a 100)
    
    const valorFinalUF = superficie * valorBaseUF * (1 - depreciacion / 100);
    totalObrasUF += valorFinalUF;

    return {
      ...work,
      valorFinalUF
    };
  });

  // 5. Totales e Hipótesis Comercial (Rango de Valor)
  const totalTasacionUF = totalTerrenoUF + totalConstruccionUF + totalObrasUF;

  // Rango comercial +/- 5%
  const valorProbableUF = totalTasacionUF;
  const valorMinimoUF = totalTasacionUF * 0.95;
  const valorMaximoUF = totalTasacionUF * 1.05;

  const valorProbableCLP = valorProbableUF * valorUF;
  const valorMinimoCLP = valorMinimoUF * valorUF;
  const valorMaximoCLP = valorMaximoUF * valorUF;

  // 6. Arriendo Sugerido por Rentabilidad Anual (4.0% a 6.5%)
  const capRates = [0.04, 0.045, 0.05, 0.055, 0.06, 0.065];
  const arriendoSugerido = capRates.map(rate => {
    const rentAnualMinUF = valorMinimoUF * rate;
    const rentAnualProbUF = valorProbableUF * rate;
    const rentAnualMaxUF = valorMaximoUF * rate;

    return {
      rate: rate * 100,
      minCLP: (rentAnualMinUF / 12) * valorUF,
      probCLP: (rentAnualProbUF / 12) * valorUF,
      maxCLP: (rentAnualMaxUF / 12) * valorUF,
      minUF: rentAnualMinUF / 12,
      probUF: rentAnualProbUF / 12,
      maxUF: rentAnualMaxUF / 12
    };
  });

  // 7. Trazabilidad de Cálculos (Paso a Paso Explicado)
  const trace = [
    {
      titulo: 'Cálculo del Terreno',
      descripcion: `Superficie Terreno (${formatNumber(m2Terreno)} m²) × Valor Terreno (${formatNumber(valorUfTerreno)} UF/m²) = ${formatUF(totalTerrenoUF)}`
    },
    {
      titulo: 'Cálculo de la Construcción (Método Chornik)',
      descripcion: `Superficie Construida (${formatNumber(m2Construido)} m²) × Valor Depreciado (${formatNumber(constDepreciadaUFm2)} UF/m²) = ${formatUF(totalConstruccionUF)} (Clase ${claseConstruccion}, Calidad ${calidadConstruccion}, Edad ${antiguedad} años)`
    }
  ];

  if (processedWorks.length > 0) {
    const itemsTrace = processedWorks.map(w => 
      `- ${w.tipo || 'Obra'}: ${formatNumber(w.superficie)} m² × ${formatNumber(w.valorBaseUF)} UF/m² (Depreciación: ${w.depreciacion}%) = ${formatUF(w.valorFinalUF)}`
    ).join('\n');

    trace.push({
      titulo: 'Obras Complementarias',
      descripcion: `Total Obras Complementarias = ${formatUF(totalObrasUF)}\n${itemsTrace}`
    });
  }

  trace.push({
    titulo: 'Tasación Base (UF)',
    descripcion: `Terreno (${formatUF(totalTerrenoUF)}) + Construcción (${formatUF(totalConstruccionUF)}) ${totalObrasUF > 0 ? '+ Obras (' + formatUF(totalObrasUF) + ')' : ''} = ${formatUF(totalTasacionUF)}`
  });

  trace.push({
    titulo: 'Rango Comercial Propuesto (±5%)',
    descripcion: `Mínimo (-5%): ${formatUF(valorMinimoUF)} | Probable (100%): ${formatUF(valorProbableUF)} | Máximo (+5%): ${formatUF(valorMaximoUF)}`
  });

  return {
    m2Terreno,
    m2Construido,
    valorUfTerreno,
    constDepreciadaUFm2,
    totalTerrenoUF,
    totalConstruccionUF,
    totalObrasUF,
    totalTasacionUF,
    valorMinimoUF,
    valorProbableUF,
    valorMaximoUF,
    valorMinimoCLP,
    valorProbableCLP,
    valorMaximoCLP,
    arriendoSugerido,
    processedWorks,
    trace
  };
}

/* Utilities for formatting */

export function formatUF(value) {
  return new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value) + ' UF';
}

export function formatCLP(value) {
  return '$ ' + new Intl.NumberFormat('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatNumber(value) {
  return new Intl.NumberFormat('es-CL', {
    maximumFractionDigits: 2
  }).format(value);
}
