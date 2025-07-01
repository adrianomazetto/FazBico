```sql
-- =============================================
-- ESTRUTURA DO BANCO DE DADOS - FAZ BICO!
-- =============================================

-- 1. Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Enum para tipos de usuário
CREATE TYPE user_role AS ENUM ('contratante', 'prestador');

-- 3. Tabela de categorias de serviços
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de prestadores (estende auth.users)
CREATE TABLE prestadores (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    telefone_whatsapp VARCHAR(20) NOT NULL,
    categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
    endereco TEXT,
    media_rank NUMERIC(3,2) DEFAULT 0.00 CHECK (media_rank >= 0 AND media_rank <= 5),
    total_avaliacoes INTEGER DEFAULT 0,
    foto_perfil_url TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de contratantes (estende auth.users)  
CREATE TABLE contratantes (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    endereco TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de avaliações
CREATE TABLE avaliacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prestador_id UUID NOT NULL REFERENCES prestadores(id) ON DELETE CASCADE,
    contratante_id UUID NOT NULL REFERENCES contratantes(id) ON DELETE CASCADE,
    nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
    comentario TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir que um contratante só pode avaliar um prestador uma vez
    UNIQUE(prestador_id, contratante_id)
);

-- 7. Tabela de perfis unificada (alternativa - combina dados de usuários)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    user_type user_role NOT NULL,
    telefone VARCHAR(20),
    endereco TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INSERÇÃO DE DADOS INICIAIS
-- =============================================

-- Inserir categorias padrão
INSERT INTO categorias (nome, descricao) VALUES 
('Encanador', 'Serviços de encanamento, instalação e manutenção hidráulica'),
('Eletricista', 'Instalações elétricas, manutenção e reparos elétricos'),
('Diarista', 'Limpeza residencial e comercial'),
('Jardineiro', 'Manutenção de jardins e paisagismo'),
('Pintor', 'Pintura residencial e comercial'),
('Marceneiro', 'Móveis sob medida e reparos em madeira'),
('Pedreiro', 'Construção e reforma de alvenaria'),
('Mecânico', 'Manutenção e reparo de veículos'),
('Técnico em Informática', 'Suporte técnico e reparo de computadores'),
('Professor Particular', 'Aulas particulares e reforço escolar'),
('Cuidador', 'Cuidados com idosos e crianças'),
('Costureira', 'Costura e ajustes de roupas'),
('Fotógrafo', 'Serviços fotográficos para eventos'),
('Personal Trainer', 'Treinamento físico personalizado'),
('Massagista', 'Massagens terapêuticas e relaxantes');

-- =============================================
-- TRIGGERS E FUNÇÕES
-- =============================================

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON categorias 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prestadores_updated_at BEFORE UPDATE ON prestadores 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contratantes_updated_at BEFORE UPDATE ON contratantes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para recalcular média de avaliações
CREATE OR REPLACE FUNCTION recalcular_media_prestador()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE prestadores 
    SET 
        media_rank = (
            SELECT COALESCE(AVG(nota::NUMERIC), 0)
            FROM avaliacoes 
            WHERE prestador_id = COALESCE(NEW.prestador_id, OLD.prestador_id)
        ),
        total_avaliacoes = (
            SELECT COUNT(*)
            FROM avaliacoes 
            WHERE prestador_id = COALESCE(NEW.prestador_id, OLD.prestador_id)
        )
    WHERE id = COALESCE(NEW.prestador_id, OLD.prestador_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para recalcular média
CREATE TRIGGER trigger_recalcular_media_insert 
    AFTER INSERT ON avaliacoes
    FOR EACH ROW EXECUTE FUNCTION recalcular_media_prestador();

CREATE TRIGGER trigger_recalcular_media_update 
    AFTER UPDATE ON avaliacoes
    FOR EACH ROW EXECUTE FUNCTION recalcular_media_prestador();

CREATE TRIGGER trigger_recalcular_media_delete 
    AFTER DELETE ON avaliacoes
    FOR EACH ROW EXECUTE FUNCTION recalcular_media_prestador();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE prestadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para prestadores
CREATE POLICY "Prestadores podem ver seus próprios dados" ON prestadores
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Todos podem ver prestadores ativos" ON prestadores
    FOR SELECT USING (ativo = true);

CREATE POLICY "Prestadores podem atualizar seus dados" ON prestadores
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para contratantes
CREATE POLICY "Contratantes podem ver seus próprios dados" ON contratantes
    FOR ALL USING (auth.uid() = id);

-- Políticas para avaliações
CREATE POLICY "Todos podem ver avaliações" ON avaliacoes
    FOR SELECT USING (true);

CREATE POLICY "Contratantes podem criar avaliações" ON avaliacoes
    FOR INSERT WITH CHECK (auth.uid() = contratante_id);

CREATE POLICY "Contratantes podem atualizar suas avaliações" ON avaliacoes
    FOR UPDATE USING (auth.uid() = contratante_id);

CREATE POLICY "Contratantes podem deletar suas avaliações" ON avaliacoes
    FOR DELETE USING (auth.uid() = contratante_id);

-- Políticas para profiles
CREATE POLICY "Usuários podem ver seus próprios perfis" ON profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Todos podem ver perfis básicos" ON profiles
    FOR SELECT USING (true);

-- Políticas para categorias (tabela pública)
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos podem ver categorias" ON categorias
    FOR SELECT USING (ativo = true);

-- =============================================
-- VIEWS ÚTEIS
-- =============================================

-- View com dados completos dos prestadores
CREATE VIEW vw_prestadores_completos AS
SELECT 
    p.id,
    p.nome,
    p.descricao,
    p.telefone_whatsapp,
    p.endereco,
    p.media_rank,
    p.total_avaliacoes,
    p.foto_perfil_url,
    p.ativo,
    p.created_at,
    c.nome as categoria_nome,
    c.id as categoria_id
FROM prestadores p
LEFT JOIN categorias c ON p.categoria_id = c.id
WHERE p.ativo = true
ORDER BY p.media_rank DESC, p.total_avaliacoes DESC;

-- View com estatísticas por categoria
CREATE VIEW vw_estatisticas_categoria AS
SELECT 
    c.id,
    c.nome,
    COUNT(p.id) as total_prestadores,
    AVG(p.media_rank) as media_geral,
    SUM(p.total_avaliacoes) as total_avaliacoes
FROM categorias c
LEFT JOIN prestadores p ON c.id = p.categoria_id AND p.ativo = true
WHERE c.ativo = true
GROUP BY c.id, c.nome
ORDER BY total_prestadores DESC;

-- =============================================
-- FUNÇÕES AUXILIARES
-- =============================================

-- Função para buscar prestadores
CREATE OR REPLACE FUNCTION buscar_prestadores(
    termo_busca TEXT DEFAULT NULL,
    categoria_filtro INTEGER DEFAULT NULL,
    limite INTEGER DEFAULT 20,
    offset_valor INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    nome VARCHAR,
    descricao TEXT,
    telefone_whatsapp VARCHAR,
    media_rank NUMERIC,
    total_avaliacoes INTEGER,
    categoria_nome VARCHAR,
    categoria_id INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.nome,
        p.descricao,
        p.telefone_whatsapp,
        p.media_rank,
        p.total_avaliacoes,
        c.nome as categoria_nome,
        c.id as categoria_id
    FROM prestadores p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    WHERE p.ativo = true
        AND (termo_busca IS NULL OR 
             p.nome ILIKE '%' || termo_busca || '%' OR
             p.descricao ILIKE '%' || termo_busca || '%' OR
             c.nome ILIKE '%' || termo_busca || '%')
        AND (categoria_filtro IS NULL OR p.categoria_id = categoria_filtro)
    ORDER BY p.media_rank DESC, p.total_avaliacoes DESC
    LIMIT limite
    OFFSET offset_valor;
END;
$$ LANGUAGE plpgsql;

-- Função para obter prestadores top avaliados
CREATE OR REPLACE FUNCTION prestadores_top_avaliados(limite INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    nome VARCHAR,
    categoria_nome VARCHAR,
    media_rank NUMERIC,
    total_avaliacoes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.nome,
        c.nome as categoria_nome,
        p.media_rank,
        p.total_avaliacoes
    FROM prestadores p
    LEFT JOIN categorias c ON p.categoria_id = c.id
    WHERE p.ativo = true 
        AND p.total_avaliacoes >= 3  -- Mínimo de 3 avaliações
    ORDER BY p.media_rank DESC, p.total_avaliacoes DESC
    LIMIT limite;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

-- Índices para prestadores
CREATE INDEX idx_prestadores_categoria ON prestadores(categoria_id);
CREATE INDEX idx_prestadores_media_rank ON prestadores(media_rank DESC);
CREATE INDEX idx_prestadores_ativo ON prestadores(ativo);
CREATE INDEX idx_prestadores_nome ON prestadores USING gin(nome gin_trgm_ops);
CREATE INDEX idx_prestadores_descricao ON prestadores USING gin(descricao gin_trgm_ops);

-- Índices para avaliações
CREATE INDEX idx_avaliacoes_prestador ON avaliacoes(prestador_id);
CREATE INDEX idx_avaliacoes_contratante ON avaliacoes(contratante_id);
CREATE INDEX idx_avaliacoes_created_at ON avaliacoes(created_at DESC);

-- Habilitar extensão para buscas de texto
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =============================================

COMMENT ON TABLE categorias IS 'Categorias de serviços oferecidos pelos prestadores';
COMMENT ON TABLE prestadores IS 'Dados específicos dos prestadores de serviço';
COMMENT ON TABLE contratantes IS 'Dados específicos dos contratantes de serviço';
COMMENT ON TABLE avaliacoes IS 'Avaliações dos prestadores feitas pelos contratantes';
COMMENT ON TABLE profiles IS 'Perfis unificados dos usuários (alternativa)';

COMMENT ON COLUMN prestadores.media_rank IS 'Média das avaliações (0.00 a 5.00)';
COMMENT ON COLUMN prestadores.total_avaliacoes IS 'Número total de avaliações recebidas';
COMMENT ON COLUMN avaliacoes.nota IS 'Nota de 1 a 5 estrelas';
```

-- =============================================
-- DADOS DE TESTE (OPCIONAL)
-- =============================================

-- Descomente para inserir dados de teste
/*
-- Inserir usuário de teste (isso normalmente seria feito via auth.users)
INSERT INTO prestadores (id, nome, descricao, telefone_whatsapp, categoria_id, media_rank, total_avaliacoes) 
VALUES 
(uuid_generate_v4(), 'João Silva', 'Encanador experiente com 10 anos no mercado', '11999998888', 1, 4.8, 25),
(uuid_generate_v4(), 'Maria Santos', 'Eletricista certificada, especialista em instalações residenciais', '11988887777', 2, 4.9, 32),
(uuid_generate_v4(), 'Ana Costa', 'Diarista confiável, trabalho com produtos próprios', '11977776666', 3, 4.7, 18);

-- Inserir contratante de teste
INSERT INTO contratantes (id, nome, telefone) 
VALUES 
(uuid_generate_v4(), 'Pedro Oliveira', '11966665555');
*/