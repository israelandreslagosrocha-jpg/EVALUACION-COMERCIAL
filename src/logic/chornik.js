import chornikData from './chornikData.json' with { type: 'json' };

/**
 * Motor Chornik para la depreciación de construcciones comerciales
 */

export const chornikTable = chornikData.yearDepreciation;
export const qualityBaseValues = chornikData.qualityBaseValues;
export const classDescriptions = chornikData.classDescriptions;
export const qualityDescriptions = chornikData.qualityDescriptions;

/**
 * Obtiene el valor de construcción depreciado por metro cuadrado en UF.
 * 
 * @param {string} clase Letra de la clase (A a I)
 * @param {number|string} calidad Calidad de construcción (1 a 5)
 * @param {number|string} antiguedad Años de antigüedad real/aparente
 * @param {number|null} valorBaseUFm2Override Permite sobreescribir el valor base UF/m2 de calidad
 * @returns {number} Valor UF/m2 final depreciado
 */
export function obtenerValorConstruccion(clase, calidad, antiguedad, valorBaseUFm2Override = null) {
  const cleanClase = (clase || 'C').toUpperCase();
  const cleanCalidad = Math.min(Math.max(1, parseInt(calidad) || 3), 5);
  const age = Math.min(Math.max(0, parseInt(antiguedad) || 0), 70);

  // 1. Obtener Valor Base de construcción (de la matriz de calidad o override)
  let valorBase = 0;
  if (valorBaseUFm2Override !== null && !isNaN(parseFloat(valorBaseUFm2Override))) {
    valorBase = parseFloat(valorBaseUFm2Override);
  } else {
    const classCaliData = qualityBaseValues[cleanClase];
    if (classCaliData) {
      valorBase = classCaliData[cleanCalidad - 1] || 0;
    }
  }

  // 2. Obtener Factor de depreciación por antigüedad
  let factorDepreciacion = 1;
  const classAgeData = chornikTable[cleanClase];
  if (classAgeData && classAgeData[age] !== undefined) {
    factorDepreciacion = classAgeData[age];
  }

  // 3. Aplicar depreciación y retornar
  return valorBase * factorDepreciacion;
}

/**
 * Obtiene el porcentaje de depreciación puro de Chornik para una clase y edad dadas.
 * 
 * @param {string} clase 
 * @param {number|string} age 
 * @returns {number} Factor de depreciación entre 0 y 1
 */
export function getDepreciation(clase, age) {
  const cleanClase = (clase || 'C').toUpperCase();
  const years = Math.min(Math.max(0, parseInt(age) || 0), 70);
  
  const classData = chornikTable[cleanClase];
  if (!classData || classData[years] === undefined) return 1.0;
  return classData[years];
}
