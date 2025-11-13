-- Migration V005: bi_report_catalog
CREATE TABLE IF NOT EXISTS public.bi_report_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO public.bi_report_catalog (id,name,description,created_at) VALUES
('r1','Hospedagem','Resumo de ocupação e tarifas', now()),
('r2','Receitas vs Energia','Comparativo de receita com consumo energético', now()),
('r3','Housekeeping SLA','Indicadores de atendimento Housekeeping', now())
ON CONFLICT (id) DO NOTHING;
