-- SCHEMA FOR SISTEMA DE TASACIÓN COMERCIAL INMOBILIARIA

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Clientes Table
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    rut VARCHAR(12),
    telefono VARCHAR(20),
    email VARCHAR(255),
    direccion TEXT,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on nombre for search speed
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_rut ON clientes(rut);

-- 2. Propiedades Table
CREATE TABLE IF NOT EXISTS propiedades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    direccion TEXT NOT NULL,
    comuna VARCHAR(100) NOT NULL,
    rol_sii VARCHAR(50),
    superficie_terreno NUMERIC(10,2) NOT NULL DEFAULT 0,
    superficie_construida NUMERIC(10,2) NOT NULL DEFAULT 0,
    clase_construccion CHAR(1) NOT NULL,
    calidad_construccion INTEGER NOT NULL CHECK (calidad_construccion BETWEEN 1 AND 5),
    antiguedad_real INTEGER DEFAULT 0,
    antiguedad_aparente INTEGER DEFAULT 0,
    observaciones TEXT,
    fotos TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_propiedades_comuna ON propiedades(comuna);

-- 3. Comparables Table (Global database of market references)
CREATE TABLE IF NOT EXISTS comparables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portal_origen VARCHAR(100),
    fecha_captura DATE DEFAULT CURRENT_DATE,
    precio_publicacion NUMERIC(12,2) NOT NULL,
    uf NUMERIC(12,2) NOT NULL,
    superficie_terreno NUMERIC(10,2) DEFAULT 0,
    superficie_construida NUMERIC(10,2) DEFAULT 0,
    dormitorios INTEGER DEFAULT 0,
    banos INTEGER DEFAULT 0,
    clase CHAR(1),
    calidad INTEGER,
    antiguedad INTEGER DEFAULT 0,
    direccion TEXT,
    comuna VARCHAR(100) NOT NULL,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comparables_comuna ON comparables(comuna);

-- 4. Evaluaciones Table (appraisals history)
CREATE TABLE IF NOT EXISTS evaluaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    propiedad_id UUID REFERENCES propiedades(id) ON DELETE CASCADE,
    fecha DATE DEFAULT CURRENT_DATE NOT NULL,
    agente VARCHAR(255) NOT NULL,
    valor_uf_dia NUMERIC(10,2) NOT NULL,
    comentarios TEXT,
    recomendacion TEXT,
    obras_complementarias JSONB DEFAULT '[]'::jsonb,
    comparables_utilizados JSONB DEFAULT '[]'::jsonb,
    resultado_tasacion JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_evaluaciones_cliente ON evaluaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_fecha ON evaluaciones(fecha);

-- Row Level Security (RLS) Policies
-- For local/easy development, we enable RLS but add open policies allowing all actions.
-- This can be locked down further in production.

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE propiedades ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparables ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluaciones ENABLE ROW LEVEL SECURITY;

-- Clients Policies
CREATE POLICY "Allow public read access to clientes" ON clientes FOR SELECT USING (true);
CREATE POLICY "Allow public write access to clientes" ON clientes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to clientes" ON clientes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to clientes" ON clientes FOR DELETE USING (true);

-- Properties Policies
CREATE POLICY "Allow public read access to propiedades" ON propiedades FOR SELECT USING (true);
CREATE POLICY "Allow public write access to propiedades" ON propiedades FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to propiedades" ON propiedades FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to propiedades" ON propiedades FOR DELETE USING (true);

-- Comparables Policies
CREATE POLICY "Allow public read access to comparables" ON comparables FOR SELECT USING (true);
CREATE POLICY "Allow public write access to comparables" ON comparables FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to comparables" ON comparables FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to comparables" ON comparables FOR DELETE USING (true);

-- Evaluations Policies
CREATE POLICY "Allow public read access to evaluaciones" ON evaluaciones FOR SELECT USING (true);
CREATE POLICY "Allow public write access to evaluaciones" ON evaluaciones FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to evaluaciones" ON evaluaciones FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to evaluaciones" ON evaluaciones FOR DELETE USING (true);
