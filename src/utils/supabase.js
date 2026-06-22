import { createClient } from '@supabase/supabase-js';

// Intentar leer las credenciales desde las variables de entorno de Vite
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

let supabase = null;
let isConfigured = false;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    isConfigured = true;
    console.log('✅ Supabase inicializado correctamente.');
  } catch (error) {
    console.error('❌ Error al inicializar Supabase:', error);
  }
} else {
  console.warn(
    '⚠️ Supabase no está configurado (faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY). Se usará LocalStorage como fallback.'
  );
}

export function isSupabaseConnected() {
  return isConfigured;
}

/* --- LOCAL STORAGE BACKEND FALLBACK --- */

const memoryStorage = {};
const storage = typeof localStorage !== 'undefined' ? localStorage : {
  getItem: (key) => memoryStorage[key] || null,
  setItem: (key, val) => { memoryStorage[key] = String(val); },
  removeItem: (key) => { delete memoryStorage[key]; }
};

function getLocal(key, defaultVal = []) {
  const data = storage.getItem(key);
  return data ? JSON.parse(data) : defaultVal;
}

function setLocal(key, value) {
  storage.setItem(key, JSON.stringify(value));
}

// Inicialización de datos semilla si no existen en almacenamiento
function initSeeds() {
  if (!storage.getItem('tasador_clientes')) {
    setLocal('tasador_clientes', [
      {
        id: 'c1-seed',
        nombre: 'Nelson Lecaro',
        rut: '12.345.678-9',
        telefono: '+56 9 8765 4321',
        email: 'nelson.lecaro@gmail.com',
        direccion: 'Rosario 1356, Curicó',
        observaciones: 'Cliente recurrente del sector Maule Norte.',
        created_at: new Date().toISOString()
      }
    ]);
  }
  
  if (!storage.getItem('tasador_propiedades')) {
    setLocal('tasador_propiedades', [
      {
        id: 'p1-seed',
        direccion: 'Rosario 1356',
        comuna: 'Curicó',
        rol_sii: '00321-00042',
        superficie_terreno: 259,
        superficie_construida: 103,
        clase_construccion: 'F',
        calidad_construccion: 3,
        antiguedad_real: 65,
        antiguedad_aparente: 30,
        observaciones: 'Propiedad de un piso con estructura soporte mixta de madera y adobe.',
        fotos: [],
        created_at: new Date().toISOString()
      }
    ]);
  }

  if (!storage.getItem('tasador_comparables')) {
    setLocal('tasador_comparables', [
      {
        id: 'comp-1',
        portal_origen: 'Portal Inmobiliario',
        fecha_captura: '2026-04-14',
        precio_publicacion: 5610,
        uf: 38477,
        superficie_terreno: 311,
        superficie_construida: 130,
        dormitorios: 3,
        banos: 2,
        clase: 'C',
        calidad: 3,
        antiguedad: 70,
        direccion: 'Calle Castelar, cerro Barón',
        comuna: 'Valparaíso',
        observaciones: 'Buena vista al mar, requiere remodelaciones menores.',
        created_at: new Date().toISOString()
      },
      {
        id: 'comp-2',
        portal_origen: 'TOCTOC',
        fecha_captura: '2026-04-14',
        precio_publicacion: 6512,
        uf: 38477,
        superficie_terreno: 321,
        superficie_construida: 133,
        dormitorios: 4,
        banos: 2,
        clase: 'E',
        calidad: 3,
        antiguedad: 70,
        direccion: 'Bellavista Juan Urzua y Nueva Dardignac',
        comuna: 'Valparaíso',
        observaciones: 'Estructura de madera original, remodelado completo.',
        created_at: new Date().toISOString()
      },
      {
        id: 'comp-3',
        portal_origen: 'Portal Inmobiliario',
        fecha_captura: '2026-04-14',
        precio_publicacion: 4894,
        uf: 38477,
        superficie_terreno: 160,
        superficie_construida: 150,
        dormitorios: 3,
        banos: 3,
        clase: 'C',
        calidad: 3,
        antiguedad: 70,
        direccion: 'Cerro Ramaditas',
        comuna: 'Valparaíso',
        observaciones: 'Estacionamiento para 2 vehículos.',
        created_at: new Date().toISOString()
      }
    ]);
  }
}

initSeeds();


/* ==================== CLIENTES CRUD ==================== */

export async function dbGetClientes() {
  if (isConfigured) {
    const { data, error } = await supabase.from('clientes').select('*').order('nombre');
    if (!error) return data;
    console.error('Error Supabase clientes:', error);
  }
  return getLocal('tasador_clientes').sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function dbAddCliente(cliente) {
  if (isConfigured) {
    const { data, error } = await supabase.from('clientes').insert([cliente]).select();
    if (!error && data) return data[0];
    console.error('Error Supabase add cliente:', error);
  }
  const items = getLocal('tasador_clientes');
  const nuevo = {
    ...cliente,
    id: cliente.id || 'cli_' + Math.random().toString(36).substr(2, 9),
    created_at: new Date().toISOString()
  };
  items.push(nuevo);
  setLocal('tasador_clientes', items);
  return nuevo;
}

export async function dbUpdateCliente(id, updates) {
  if (isConfigured) {
    const { data, error } = await supabase.from('clientes').update(updates).eq('id', id).select();
    if (!error && data) return data[0];
    console.error('Error Supabase update cliente:', error);
  }
  const items = getLocal('tasador_clientes');
  const index = items.findIndex(item => item.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    setLocal('tasador_clientes', items);
    return items[index];
  }
  return null;
}

export async function dbDeleteCliente(id) {
  if (isConfigured) {
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (!error) return true;
    console.error('Error Supabase delete cliente:', error);
  }
  const items = getLocal('tasador_clientes');
  const filtered = items.filter(item => item.id !== id);
  setLocal('tasador_clientes', filtered);
  return true;
}


/* ==================== PROPIEDADES CRUD ==================== */

export async function dbGetPropiedades() {
  if (isConfigured) {
    const { data, error } = await supabase.from('propiedades').select('*').order('created_at', { ascending: false });
    if (!error) return data;
    console.error('Error Supabase propiedades:', error);
  }
  return getLocal('tasador_propiedades');
}

export async function dbAddPropiedad(prop) {
  if (isConfigured) {
    const { data, error } = await supabase.from('propiedades').insert([prop]).select();
    if (!error && data) return data[0];
    console.error('Error Supabase add propiedad:', error);
  }
  const items = getLocal('tasador_propiedades');
  const nuevo = {
    ...prop,
    id: prop.id || 'prop_' + Math.random().toString(36).substr(2, 9),
    created_at: new Date().toISOString()
  };
  items.push(nuevo);
  setLocal('tasador_propiedades', items);
  return nuevo;
}

export async function dbUpdatePropiedad(id, updates) {
  if (isConfigured) {
    const { data, error } = await supabase.from('propiedades').update(updates).eq('id', id).select();
    if (!error && data) return data[0];
    console.error('Error Supabase update propiedad:', error);
  }
  const items = getLocal('tasador_propiedades');
  const index = items.findIndex(item => item.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    setLocal('tasador_propiedades', items);
    return items[index];
  }
  return null;
}

export async function dbDeletePropiedad(id) {
  if (isConfigured) {
    const { error } = await supabase.from('propiedades').delete().eq('id', id);
    if (!error) return true;
    console.error('Error Supabase delete propiedad:', error);
  }
  const items = getLocal('tasador_propiedades');
  const filtered = items.filter(item => item.id !== id);
  setLocal('tasador_propiedades', filtered);
  return true;
}


/* ==================== COMPARABLES CRUD ==================== */

export async function dbGetComparables(comuna = '') {
  if (isConfigured) {
    let query = supabase.from('comparables').select('*');
    if (comuna) {
      query = query.eq('comuna', comuna);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error) return data;
    console.error('Error Supabase comparables:', error);
  }
  const comps = getLocal('tasador_comparables');
  if (comuna) {
    return comps.filter(c => c.comuna?.toLowerCase() === comuna.toLowerCase());
  }
  return comps;
}

export async function dbAddComparable(comp) {
  if (isConfigured) {
    const { data, error } = await supabase.from('comparables').insert([comp]).select();
    if (!error && data) return data[0];
    console.error('Error Supabase add comparable:', error);
  }
  const items = getLocal('tasador_comparables');
  const nuevo = {
    ...comp,
    id: comp.id || 'comp_' + Math.random().toString(36).substr(2, 9),
    created_at: new Date().toISOString()
  };
  items.push(nuevo);
  setLocal('tasador_comparables', items);
  return nuevo;
}

export async function dbUpdateComparable(id, updates) {
  if (isConfigured) {
    const { data, error } = await supabase.from('comparables').update(updates).eq('id', id).select();
    if (!error && data) return data[0];
    console.error('Error Supabase update comparable:', error);
  }
  const items = getLocal('tasador_comparables');
  const index = items.findIndex(item => item.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    setLocal('tasador_comparables', items);
    return items[index];
  }
  return null;
}


/* ==================== EVALUACIONES CRUD ==================== */

export async function dbGetEvaluaciones() {
  if (isConfigured) {
    const { data, error } = await supabase
      .from('evaluaciones')
      .select('*, clientes(*), propiedades(*)')
      .order('fecha', { ascending: false });
    if (!error) return data;
    console.error('Error Supabase evaluaciones:', error);
  }
  
  // En LocalStorage necesitamos resolver las relaciones de clientes y propiedades a mano
  const evals = getLocal('tasador_evaluaciones');
  const clis = getLocal('tasador_clientes');
  const props = getLocal('tasador_propiedades');
  
  return evals.map(ev => ({
    ...ev,
    clientes: clis.find(c => c.id === ev.cliente_id) || null,
    propiedades: props.find(p => p.id === ev.propiedad_id) || null
  })).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

export async function dbAddEvaluacion(evalua) {
  if (isConfigured) {
    const { data, error } = await supabase.from('evaluaciones').insert([evalua]).select();
    if (!error && data) return data[0];
    console.error('Error Supabase add evaluacion:', error);
  }
  const items = getLocal('tasador_evaluaciones');
  const nuevo = {
    ...evalua,
    id: evalua.id || 'eval_' + Math.random().toString(36).substr(2, 9),
    created_at: new Date().toISOString()
  };
  items.push(nuevo);
  setLocal('tasador_evaluaciones', items);
  return nuevo;
}

export async function dbUpdateEvaluacion(id, updates) {
  if (isConfigured) {
    const { data, error } = await supabase.from('evaluaciones').update(updates).eq('id', id).select();
    if (!error && data) return data[0];
    console.error('Error Supabase update evaluacion:', error);
  }
  const items = getLocal('tasador_evaluaciones');
  const index = items.findIndex(item => item.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    setLocal('tasador_evaluaciones', items);
    return items[index];
  }
  return null;
}

export async function dbDeleteEvaluacion(id) {
  if (isConfigured) {
    const { error } = await supabase.from('evaluaciones').delete().eq('id', id);
    if (!error) return true;
    console.error('Error Supabase delete evaluacion:', error);
  }
  const items = getLocal('tasador_evaluaciones');
  const filtered = items.filter(item => item.id !== id);
  setLocal('tasador_evaluaciones', filtered);
  return true;
}
