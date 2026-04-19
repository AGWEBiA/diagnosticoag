// Schema declarativo das 5 etapas do diagnóstico.
// Snapshot completo (com labels) é salvo em diagnosticos.respostas
// para preservar legibilidade mesmo se o schema mudar.

export type PerguntaTipo = 'radio' | 'number' | 'currency' | 'percent' | 'textarea' | 'multi-select';

export interface OpcaoPergunta {
  value: string;
  label: string;
}

export interface Pergunta {
  id: string;
  label: string;
  tipo: PerguntaTipo;
  obrigatoria?: boolean;
  opcoes?: OpcaoPergunta[];
  placeholder?: string;
  min?: number;
  max?: number;
  // Para multi-select / radio dependentes (ex: estratégia de maior retorno usa as dominadas)
  opcoesDe?: string;
  ajuda?: string;
}

export interface Etapa {
  id: string;
  titulo: string;
  descricao?: string;
  perguntas: Pergunta[];
}

// --- ETAPAS UNIVERSAIS ---

export const ETAPA_NICHO: Etapa = {
  id: 'nicho',
  titulo: 'Nicho de atuação',
  descricao: 'Selecione o que melhor descreve seu negócio.',
  perguntas: [
    {
      id: 'segmento',
      label: 'Qual é seu nicho?',
      tipo: 'radio',
      obrigatoria: true,
      opcoes: [
        { value: 'infoprodutor', label: '📚 Infoprodutor' },
        { value: 'consultor_marketing', label: '📊 Consultor de Marketing Digital' },
        { value: 'outro', label: '💼 Outro nicho' },
      ],
    },
    {
      id: 'empresa_nome',
      label: 'Nome da empresa ou marca',
      tipo: 'textarea',
      placeholder: 'Ex: Acme Cursos',
    },
  ],
};

export const ETAPA_UNIVERSAIS: Etapa = {
  id: 'universais',
  titulo: 'Informações básicas',
  perguntas: [
    {
      id: 'faturamento_mensal',
      label: '💰 Qual é seu faturamento mensal?',
      tipo: 'radio',
      obrigatoria: true,
      opcoes: [
        { value: 'ate_5k', label: 'Até R$ 5.000' },
        { value: '5k_15k', label: 'R$ 5.000 – R$ 15.000' },
        { value: '15k_50k', label: 'R$ 15.000 – R$ 50.000' },
        { value: '50k_100k', label: 'R$ 50.000 – R$ 100.000' },
        { value: 'acima_100k', label: 'Acima de R$ 100.000' },
      ],
    },
    {
      id: 'num_produtos',
      label: '📦 Quantos produtos você possui?',
      tipo: 'number',
      obrigatoria: true,
      min: 0,
      max: 999,
    },
    {
      id: 'investimento_marketing',
      label: '💸 Quanto investe em marketing por mês? (R$)',
      tipo: 'currency',
      obrigatoria: true,
      min: 0,
    },
    {
      id: 'margem_lucro',
      label: '📈 Margem de lucro (%)',
      tipo: 'percent',
      min: 0,
      max: 100,
    },
    {
      id: 'num_pessoas',
      label: '👥 Quantas pessoas trabalham com você?',
      tipo: 'number',
      min: 1,
      max: 999,
    },
    {
      id: 'maior_gargalo',
      label: '🚧 Qual é seu maior gargalo?',
      tipo: 'radio',
      obrigatoria: true,
      opcoes: [
        { value: 'leads', label: 'Falta de leads qualificados' },
        { value: 'conversao', label: 'Baixa taxa de conversão' },
        { value: 'operacional', label: 'Desorganização operacional' },
        { value: 'capital', label: 'Falta de capital/caixa' },
        { value: 'outro', label: 'Outro' },
      ],
    },
  ],
};

export const ETAPA_METAS: Etapa = {
  id: 'metas',
  titulo: 'Metas e projeções',
  descricao: 'Metas devem ser progressivas (90 < 180 < 365).',
  perguntas: [
    {
      id: 'meta_90_dias',
      label: '📅 Meta de faturamento em 90 dias (R$)',
      tipo: 'currency',
      obrigatoria: true,
      min: 0,
    },
    {
      id: 'meta_180_dias',
      label: '📅 Meta em 180 dias (R$)',
      tipo: 'currency',
      obrigatoria: true,
      min: 0,
    },
    {
      id: 'meta_365_dias',
      label: '📅 Meta em 365 dias (R$)',
      tipo: 'currency',
      obrigatoria: true,
      min: 0,
    },
  ],
};

const ESTRATEGIAS: OpcaoPergunta[] = [
  { value: 'trafego_pago', label: 'Tráfego Pago (Google/Meta Ads)' },
  { value: 'email', label: 'Email Marketing' },
  { value: 'seo', label: 'SEO / Conteúdo orgânico' },
  { value: 'indicacoes', label: 'Indicações / Referências' },
  { value: 'parcerias', label: 'Parcerias estratégicas' },
  { value: 'outbound', label: 'Outbound / Prospecção ativa' },
  { value: 'webinarios', label: 'Webinários / Eventos online' },
  { value: 'afiliados', label: 'Programa de afiliados' },
  { value: 'outro', label: 'Outro' },
];

export const ETAPA_ESTRATEGIAS: Etapa = {
  id: 'estrategias',
  titulo: 'Estratégias',
  perguntas: [
    {
      id: 'estrategias_dominadas',
      label: '🎯 Quais estratégias você domina ou aplica?',
      tipo: 'multi-select',
      obrigatoria: true,
      opcoes: ESTRATEGIAS,
    },
    {
      id: 'estrategia_maior_retorno',
      label: '✅ Qual traz MAIOR retorno?',
      tipo: 'radio',
      obrigatoria: true,
      opcoesDe: 'estrategias_dominadas',
    },
    {
      id: 'estrategia_menor_retorno',
      label: '⚠️ Qual traz MENOR retorno?',
      tipo: 'radio',
      obrigatoria: true,
      opcoesDe: 'estrategias_dominadas',
    },
    {
      id: 'aprendizados_texto',
      label: '💡 O que você aprendeu nos últimos 12 meses?',
      tipo: 'textarea',
      placeholder: 'Conte os principais aprendizados, erros, acertos...',
    },
  ],
};

// --- ETAPAS ESPECÍFICAS POR NICHO ---

const ETAPA_INFOPRODUTOR: Etapa = {
  id: 'especifico',
  titulo: 'Perguntas específicas — Infoprodutor',
  perguntas: [
    {
      id: 'tipo_produto_principal',
      label: 'Tipo de produto principal',
      tipo: 'radio',
      obrigatoria: true,
      opcoes: [
        { value: 'curso', label: 'Curso online' },
        { value: 'mentoria', label: 'Mentoria' },
        { value: 'comunidade', label: 'Comunidade / Assinatura' },
        { value: 'ebook', label: 'Ebook / Material digital' },
      ],
    },
    { id: 'ticket_medio', label: 'Ticket médio (R$)', tipo: 'currency', obrigatoria: true, min: 0 },
    {
      id: 'plataforma_venda',
      label: 'Plataforma principal de venda',
      tipo: 'radio',
      opcoes: [
        { value: 'hotmart', label: 'Hotmart' },
        { value: 'eduzz', label: 'Eduzz' },
        { value: 'kiwify', label: 'Kiwify' },
        { value: 'proprio', label: 'Plataforma própria' },
        { value: 'outra', label: 'Outra' },
      ],
    },
    { id: 'ltv_estimado', label: 'LTV estimado por cliente (R$)', tipo: 'currency', min: 0 },
    {
      id: 'canal_captacao',
      label: 'Principal canal de captação',
      tipo: 'textarea',
      placeholder: 'Ex: Instagram orgânico + Meta Ads',
    },
  ],
};

const ETAPA_CONSULTOR: Etapa = {
  id: 'especifico',
  titulo: 'Perguntas específicas — Consultor de Marketing',
  perguntas: [
    {
      id: 'modelo_cobranca',
      label: 'Modelo de cobrança',
      tipo: 'radio',
      obrigatoria: true,
      opcoes: [
        { value: 'fee_mensal', label: 'Fee mensal' },
        { value: 'projeto', label: 'Por projeto' },
        { value: 'performance', label: 'Performance' },
        { value: 'hibrido', label: 'Híbrido' },
      ],
    },
    { id: 'ticket_medio_mensal', label: 'Ticket médio mensal por cliente (R$)', tipo: 'currency', obrigatoria: true, min: 0 },
    { id: 'clientes_ativos', label: 'Número de clientes ativos', tipo: 'number', obrigatoria: true, min: 0 },
    {
      id: 'principal_servico',
      label: 'Principal serviço',
      tipo: 'radio',
      opcoes: [
        { value: 'trafego', label: 'Gestão de tráfego' },
        { value: 'seo', label: 'SEO' },
        { value: 'branding', label: 'Branding' },
        { value: 'consultoria', label: 'Consultoria estratégica' },
        { value: 'outro', label: 'Outro' },
      ],
    },
    { id: 'tempo_medio_contrato', label: 'Tempo médio de contrato (meses)', tipo: 'number', min: 0, max: 120 },
  ],
};

const ETAPA_OUTRO: Etapa = {
  id: 'especifico',
  titulo: 'Perguntas específicas — Outro nicho',
  perguntas: [
    {
      id: 'descricao_modelo',
      label: 'Descreva seu modelo de negócio',
      tipo: 'textarea',
      obrigatoria: true,
      placeholder: 'Como sua empresa gera valor e receita?',
    },
    {
      id: 'principal_fonte_receita',
      label: 'Principal fonte de receita',
      tipo: 'textarea',
      obrigatoria: true,
    },
    {
      id: 'modelo_recorrencia',
      label: 'Modelo recorrente ou one-shot?',
      tipo: 'radio',
      obrigatoria: true,
      opcoes: [
        { value: 'recorrente', label: 'Recorrente (assinatura/contrato)' },
        { value: 'one_shot', label: 'One-shot (venda única)' },
        { value: 'misto', label: 'Misto' },
      ],
    },
  ],
};

// --- ETAPA 6: APROFUNDAMENTO (obrigatória, alimenta a IA com contexto qualitativo) ---

export const ETAPA_APROFUNDAMENTO: Etapa = {
  id: 'aprofundamento',
  titulo: 'Aprofundamento estratégico',
  descricao:
    'Estas respostas são o que diferencia um diagnóstico genérico de uma análise realmente estratégica. Seja específico — quanto mais detalhe, mais profunda será a análise da IA.',
  perguntas: [
    {
      id: 'icp_cliente_ideal',
      label: '🎯 Quem é seu cliente ideal (ICP)?',
      tipo: 'textarea',
      obrigatoria: true,
      placeholder:
        'Descreva: perfil demográfico, momento de vida/negócio, dores principais, o que ele já tentou antes de te procurar, faixa de renda/faturamento, canais que frequenta...',
      ajuda: 'Quanto mais específico, melhor. Evite "qualquer pessoa interessada".',
    },
    {
      id: 'maior_frustracao_atual',
      label: '😤 Qual é sua maior frustração hoje no negócio?',
      tipo: 'textarea',
      obrigatoria: true,
      placeholder:
        'O que mais te tira o sono? Onde você sente que está "batendo a cabeça na parede"? Por que isso ainda não foi resolvido?',
    },
    {
      id: 'tentativas_falhas',
      label: '❌ O que você já tentou e NÃO funcionou nos últimos 12 meses?',
      tipo: 'textarea',
      obrigatoria: true,
      placeholder:
        'Liste estratégias, ferramentas, contratações, campanhas ou investimentos que tentou e não deram o resultado esperado. Por que você acha que falharam?',
    },
    {
      id: 'recursos_disponiveis',
      label: '🛠️ Quais recursos você tem disponíveis hoje?',
      tipo: 'textarea',
      obrigatoria: true,
      placeholder:
        'Tempo semanal dedicado, orçamento disponível para investir nos próximos 90 dias, equipe (interna/freelancers), ferramentas já contratadas, ativos digitais (lista de email, audiência, autoridade)...',
    },
    {
      id: 'prazo_critico',
      label: '⏰ Existe algum prazo crítico ou marco importante?',
      tipo: 'textarea',
      obrigatoria: true,
      placeholder:
        'Ex: lançamento de produto em X meses, fim do contrato com cliente âncora, necessidade de bater meta antes de Y data, evento sazonal, runway de capital...',
    },
    {
      id: 'concorrencia_percebida',
      label: '⚔️ Como você percebe sua concorrência?',
      tipo: 'textarea',
      obrigatoria: true,
      placeholder:
        'Quem são seus 2-3 principais concorrentes? O que eles fazem melhor que você? O que você faz melhor? Por que um cliente escolheria você?',
    },
  ],
};

export function getEtapasPorSegmento(segmento: string | undefined): Etapa[] {
  const especifica =
    segmento === 'infoprodutor'
      ? ETAPA_INFOPRODUTOR
      : segmento === 'consultor_marketing'
        ? ETAPA_CONSULTOR
        : ETAPA_OUTRO;
  return [
    ETAPA_NICHO,
    ETAPA_UNIVERSAIS,
    ETAPA_METAS,
    ETAPA_ESTRATEGIAS,
    especifica,
    ETAPA_APROFUNDAMENTO,
  ];
}

export const TOTAL_ETAPAS = 6;
