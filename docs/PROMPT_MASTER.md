# PROMPT FINAL MEGA-COMPLETO PARA LOVABLE
## Sistema de Diagnóstico de Negócios Digitais - IA Vertical Enterprise-Grade

### ⚠️ CRÍTICO: LEIA COMPLETAMENTE ANTES DE COMEÇAR

Este é o **PROMPT FINAL DEFINITIVO** para construir um sistema de diagnóstico de negócios com IA Enterprise-Grade. Ele integra TUDO: IA Vertical, IA Generativa, Anti-alucinação, RAG, Múltiplos Motores de IA, Auditoria Completa.

**Tempo estimado de desenvolvimento:** 4-6 semanas
**Complexidade:** Enterprise-Grade
**Qualidade esperada:** Pronta para produção

---

# 🎯 VISÃO GERAL DO PROJETO

## Objetivo Principal
Construir um **Sistema Inteligente de Diagnóstico de Negócios Digitais** que:

1. Coleta dados de negócios através de formulário dinâmico
2. Analisa profundamente usando IA Vertical (Fine-tuned)
3. Gera recomendações personalizadas com IA Generativa
4. Verifica fatos e evita alucinações (Anti-hallucination)
5. Gera relatórios em PDF profissionais
6. Permite interação com chat inteligente
7. Fornece dashboard administrativo completo
8. Registra auditoria completa de todas operações

## Diferencial Enterprise
- ✅ Zero alucinações (verificação tripla)
- ✅ 5 motores de IA com fallback automático
- ✅ Base de conhecimento verificada (500+ fontes)
- ✅ Score de confiança em cada resposta (0-100%)
- ✅ Rastreabilidade completa
- ✅ Conformidade GDPR/CCPA/SOC2
- ✅ 99.95% uptime com redundância

---

# 🏗️ ARQUITETURA TÉCNICA COMPLETA

## Stack Tecnológico

```
FRONTEND:
├─ React.js 18+
├─ TypeScript
├─ Tailwind CSS
├─ React Query (Data fetching)
├─ Zustand (State management)
├─ React Hook Form (Formulários)
└─ Chart.js / D3.js (Gráficos)

BACKEND:
├─ Node.js 18+
├─ Express.js
├─ TypeScript
├─ PostgreSQL 15+
├─ Redis (Cache + Sessions)
├─ Elasticsearch (Busca)
├─ Pinecone (Vector Store)
└─ Bull (Job Queue)

IA & APIS:
├─ OpenAI API (GPT-4-turbo)
├─ Anthropic Claude API
├─ Google Gemini API
├─ Cohere API
├─ Mistral API
└─ LangChain (Orquestração)

INFRAESTRUTURA:
├─ AWS S3 (Storage)
├─ AWS CloudFront (CDN)
├─ Vercel (Frontend)
├─ Railway/Render (Backend)
├─ Datadog (Monitoring)
└─ Sentry (Error tracking)
```

## Estrutura de Pastas

```
projeto-diagnostico/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── Formulario/
│   │   │   │   ├── SeletorNicho.tsx
│   │   │   │   ├── PerguntasUniversais.tsx
│   │   │   │   ├── MetasProjecoes.tsx
│   │   │   │   ├── Estrategias.tsx
│   │   │   │   ├── PerguntasEspecificas.tsx
│   │   │   │   └── FormularioContainer.tsx
│   │   │   ├── Resultado/
│   │   │   │   ├── ResultadoPreview.tsx
│   │   │   │   ├── ScoreDisplay.tsx
│   │   │   │   ├── RecomendacaoCard.tsx
│   │   │   │   └── OportunidadesDesafios.tsx
│   │   │   ├── Chat/
│   │   │   │   ├── ChatIA.tsx
│   │   │   │   ├── ChatMessage.tsx
│   │   │   │   └── ChatInput.tsx
│   │   │   ├── Dashboard/
│   │   │   │   ├── DashboardAdmin.tsx
│   │   │   │   ├── PipelineKanban.tsx
│   │   │   │   ├── FiltrosAvancados.tsx
│   │   │   │   ├── CardDiagnostico.tsx
│   │   │   │   └── AcoesRapidas.tsx
│   │   │   ├── Relatorio/
│   │   │   │   ├── RelatorioPreview.tsx
│   │   │   │   ├── SecaoAnalise.tsx
│   │   │   │   ├── GraficosPilares.tsx
│   │   │   │   └── PlanoAcao.tsx
│   │   │   └── Comum/
│   │   │       ├── Header.tsx
│   │   │       ├── Sidebar.tsx
│   │   │       ├── ProgressBar.tsx
│   │   │       └── RespostaComConfianca.tsx
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DiagnosticoPage.tsx
│   │   │   ├── ResultadoPage.tsx
│   │   │   ├── AdminPage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   ├── services/
│   │   │   ├── apiService.ts
│   │   │   ├── iaService.ts
│   │   │   └── authService.ts
│   │   ├── hooks/
│   │   │   ├── useFormulario.ts
│   │   │   ├── useChat.ts
│   │   │   └── useDiagnostico.ts
│   │   ├── utils/
│   │   │   ├── validacoes.ts
│   │   │   ├── formatadores.ts
│   │   │   └── constantes.ts
│   │   ├── types/
│   │   │   ├── diagnostico.ts
│   │   │   ├── usuario.ts
│   │   │   └── ia.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── diagnosticos.ts
│   │   │   ├── chat.ts
│   │   │   ├── admin.ts
│   │   │   ├── relatorios.ts
│   │   │   └── auditoria.ts
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── diagnosticoController.ts
│   │   │   ├── chatController.ts
│   │   │   ├── adminController.ts
│   │   │   └── relatorioController.ts
│   │   ├── services/
│   │   │   ├── iaService.ts (Orquestração de IA)
│   │   │   ├── openaiService.ts
│   │   │   ├── claudeService.ts
│   │   │   ├── geminiService.ts
│   │   │   ├── cohereService.ts
│   │   │   ├── mistralService.ts
│   │   │   ├── ragService.ts
│   │   │   ├── halluccinationDetector.ts
│   │   │   ├── factChecker.ts
│   │   │   ├── confidenceScoring.ts
│   │   │   ├── pdfService.ts
│   │   │   ├── cacheService.ts
│   │   │   ├── auditService.ts
│   │   │   └── diagnosticoService.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Diagnostico.ts
│   │   │   ├── InteracaoChat.ts
│   │   │   ├── RelatorioPDF.ts
│   │   │   ├── AuditLog.ts
│   │   │   ├── KnowledgeBase.ts
│   │   │   └── OperacaoIA.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   ├── rateLimit.ts
│   │   │   ├── logging.ts
│   │   │   └── validation.ts
│   │   ├── utils/
│   │   │   ├── prompts.ts (Prompts de IA)
│   │   │   ├── validators.ts
│   │   │   ├── helpers.ts
│   │   │   └── constants.ts
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   ├── elasticsearch.ts
│   │   │   ├── pinecone.ts
│   │   │   └── env.ts
│   │   ├── scripts/
│   │   │   ├── populateKnowledgeBase.ts
│   │   │   ├── finetuneModel.ts
│   │   │   └── seedDatabase.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── database/
│   │   ├── migrations/
│   │   └── seeds/
│   └── package.json
│
├── docs/
│   ├── API.md
│   ├── ARQUITETURA.md
│   ├── DEPLOYMENT.md
│   └── TROUBLESHOOTING.md
│
└── README.md
```

---

# 📊 MODELO DE DADOS COMPLETO

## Tabelas PostgreSQL

```sql
-- USUARIOS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  tipo_usuario ENUM('lead', 'admin') DEFAULT 'lead',
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ativo BOOLEAN DEFAULT true,
  CONSTRAINT email_valido CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tipo ON users(tipo_usuario);

-- DIAGNOSTICOS
CREATE TABLE diagnosticos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nicho VARCHAR(100) NOT NULL,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_conclusao TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('em_progresso', 'concluido', 'arquivado') DEFAULT 'em_progresso',
  
  -- DADOS DO FORMULÁRIO
  faturamento_mensal VARCHAR(50),
  num_produtos INTEGER,
  investimento_marketing DECIMAL(10, 2),
  margem_lucro DECIMAL(5, 2),
  num_pessoas INTEGER,
  maior_gargalo TEXT,
  meta_90_dias DECIMAL(12, 2),
  meta_180_dias DECIMAL(12, 2),
  meta_365_dias DECIMAL(12, 2),
  estrategias_dominadas JSON,
  estrategia_maior_retorno VARCHAR(100),
  estrategia_menor_retorno VARCHAR(100),
  aprendizados_texto TEXT,
  dados_nicho JSON,
  
  -- ANÁLISE GERADA POR IA
  analise_ia_profunda TEXT,
  insights_ia JSON,
  recomendacoes_ia JSON,
  plano_acao_ia JSON,
  
  -- RESULTADOS
  score_geral INTEGER CHECK (score_geral >= 0 AND score_geral <= 100),
  quadrante VARCHAR(50),
  recomendacao_principal VARCHAR(100),
  oportunidades JSON,
  desafios JSON,
  
  -- CONTROLE DE IA
  versao_ia_utilizada VARCHAR(50),
  tokens_utilizados INTEGER,
  custo_ia DECIMAL(10, 4),
  
  CONSTRAINT score_valido CHECK (score_geral IS NULL OR (score_geral >= 0 AND score_geral <= 100))
);

CREATE INDEX idx_diagnosticos_user ON diagnosticos(user_id);
CREATE INDEX idx_diagnosticos_status ON diagnosticos(status);
CREATE INDEX idx_diagnosticos_nicho ON diagnosticos(nicho);
CREATE INDEX idx_diagnosticos_score ON diagnosticos(score_geral);

-- INTERAÇÕES DE CHAT
CREATE TABLE interacoes_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id UUID NOT NULL REFERENCES diagnosticos(id) ON DELETE CASCADE,
  tipo ENUM('usuario', 'ia') NOT NULL,
  mensagem TEXT NOT NULL,
  contexto_diagnostico JSON,
  score_confianca INTEGER,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_diagnostico ON interacoes_chat(diagnostico_id);
CREATE INDEX idx_chat_tipo ON interacoes_chat(tipo);

-- RELATÓRIOS PDF
CREATE TABLE relatorios_pdf (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id UUID NOT NULL REFERENCES diagnosticos(id) ON DELETE CASCADE,
  url_pdf VARCHAR(500),
  conteudo_gerado_ia TEXT,
  data_geracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_envio TIMESTAMP,
  status ENUM('gerado', 'enviado', 'visualizado') DEFAULT 'gerado',
  versao_ia_utilizada VARCHAR(50),
  tokens_utilizados INTEGER
);

CREATE INDEX idx_pdf_diagnostico ON relatorios_pdf(diagnostico_id);
CREATE INDEX idx_pdf_status ON relatorios_pdf(status);

-- AUDITORIA
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id UUID REFERENCES diagnosticos(id) ON DELETE SET NULL,
  tipo_operacao VARCHAR(50),
  entrada_usuario TEXT,
  resposta_ia TEXT,
  score_confianca INTEGER,
  score_alucinacao DECIMAL(3,2),
  fontes_utilizadas JSON,
  conhecimento_utilizado JSON,
  verificacoes_realizadas JSON,
  status ENUM('aceita', 'rejeitada', 'revisada') DEFAULT 'aceita',
  motivo_rejeicao TEXT,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  usuario_responsavel VARCHAR(255)
);

CREATE INDEX idx_audit_diagnostico ON audit_log(diagnostico_id);
CREATE INDEX idx_audit_tipo ON audit_log(tipo_operacao);
CREATE INDEX idx_audit_status ON audit_log(status);
CREATE INDEX idx_audit_data ON audit_log(data_criacao);

-- TRAIL DE AUDITORIA DE IA
CREATE TABLE audit_trail_ia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_log_id UUID NOT NULL REFERENCES audit_log(id) ON DELETE CASCADE,
  evento VARCHAR(100),
  descricao TEXT,
  dados_evento JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BASE DE CONHECIMENTO
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria VARCHAR(100),
  subcategoria VARCHAR(100),
  topico VARCHAR(255),
  conteudo TEXT,
  fonte VARCHAR(255),
  autor_especialista VARCHAR(255),
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  versao_conhecimento INTEGER,
  confiabilidade_score DECIMAL(3,2) CHECK (confiabilidade_score >= 0.80),
  tags JSON,
  embedding VECTOR(1536),
  referencias JSON,
  casos_estudo JSON,
  CONSTRAINT confiabilidade_minima CHECK (confiabilidade_score >= 0.80)
);

CREATE INDEX idx_knowledge_categoria ON knowledge_base(categoria);
CREATE INDEX idx_knowledge_topico ON knowledge_base(topico);
CREATE INDEX idx_knowledge_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops);

-- VALIDAÇÃO DE CONHECIMENTO
CREATE TABLE knowledge_validacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_id UUID NOT NULL REFERENCES knowledge_base(id) ON DELETE CASCADE,
  validador_especialista VARCHAR(255),
  data_validacao TIMESTAMP,
  score_validacao DECIMAL(3,2),
  observacoes TEXT,
  status ENUM('validado', 'pendente', 'rejeitado')
);

-- OPERAÇÕES DE IA
CREATE TABLE operacoes_ia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id UUID REFERENCES diagnosticos(id) ON DELETE SET NULL,
  tipo_operacao VARCHAR(50),
  motor_ia VARCHAR(50),
  tokens_input INTEGER,
  tokens_output INTEGER,
  custo DECIMAL(10, 4),
  latencia_ms INTEGER,
  status ENUM('sucesso', 'erro') DEFAULT 'sucesso',
  mensagem_erro TEXT,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_operacoes_motor ON operacoes_ia(motor_ia);
CREATE INDEX idx_operacoes_status ON operacoes_ia(status);
CREATE INDEX idx_operacoes_data ON operacoes_ia(data_criacao);
```

---

# 🎨 INTERFACE DO USUÁRIO - FLUXO COMPLETO

## 1. TELA DE LOGIN/CADASTRO

```typescript
// frontend/src/pages/LoginPage.tsx
interface LoginPageProps {}

export const LoginPage: React.FC<LoginPageProps> = () => {
  const [aba, setAba] = useState<'login' | 'cadastro'>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      if (!response.ok) {
        throw new Error('Email ou senha incorretos');
      }

      const { token, user } = await response.json();
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      navigate(user.tipo_usuario === 'admin' ? '/admin' : '/diagnostico');
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha, nome })
      });

      if (!response.ok) {
        throw new Error('Erro ao criar conta');
      }

      const { token, user } = await response.json();
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      navigate('/diagnostico');
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Diagnóstico de Negócios</h1>
        <p className="text-gray-600 mb-6">Análise inteligente com IA Enterprise-Grade</p>

        {/* Abas */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setAba('login')}
            className={`flex-1 py-2 px-4 rounded font-semibold transition ${
              aba === 'login'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setAba('cadastro')}
            className={`flex-1 py-2 px-4 rounded font-semibold transition ${
              aba === 'cadastro'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={aba === 'login' ? handleLogin : handleCadastro} className="space-y-4">
          {aba === 'cadastro' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Seu nome"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mínimo 8 caracteres"
              required
            />
          </div>

          {erro && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">{erro}</div>}

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            {carregando ? 'Processando...' : aba === 'login' ? 'Entrar' : 'Criar Conta'}
          </button>
        </form>
      </div>
    </div>
  );
};
```

## 2. TELA DE SELEÇÃO DE NICHO

```typescript
// frontend/src/components/Formulario/SeletorNicho.tsx
interface SeletorNichoProps {
  onSelecionarNicho: (nicho: string) => void;
}

const NICHOS = [
  {
    id: 'infoprodutor',
    titulo: 'Infoprodutor',
    descricao: 'Criador de Conteúdo e Produtos Digitais',
    icone: '📚'
  },
  {
    id: 'agencia_lancamento',
    titulo: 'Agência de Lançamento',
    descricao: 'Especializada em Lançamentos de Infoprodutos',
    icone: '🚀'
  },
  {
    id: 'consultor_marketing',
    titulo: 'Consultor de Marketing Digital',
    descricao: 'Prestador de Serviços B2B',
    icone: '📊'
  },
  {
    id: 'outro',
    titulo: 'Outro Nicho',
    descricao: 'Descreva seu modelo de negócio',
    icone: '💼'
  }
];

export const SeletorNicho: React.FC<SeletorNichoProps> = ({ onSelecionarNicho }) => {
  const [nichoSelecionado, setNichoSelecionado] = useState<string | null>(null);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Etapa 1 de 5: Qual é seu nicho de atuação?</h2>
        <p className="text-gray-600">Selecione o nicho que melhor descreve seu negócio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {NICHOS.map((nicho) => (
          <button
            key={nicho.id}
            onClick={() => setNichoSelecionado(nicho.id)}
            className={`p-6 rounded-lg border-2 transition text-left ${
              nichoSelecionado === nicho.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
          >
            <div className="text-3xl mb-2">{nicho.icone}</div>
            <h3 className="font-semibold text-gray-800 mb-1">{nicho.titulo}</h3>
            <p className="text-sm text-gray-600">{nicho.descricao}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => onSelecionarNicho(nichoSelecionado!)}
          disabled={!nichoSelecionado}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          Próximo
        </button>
      </div>
    </div>
  );
};
```

## 3. TELA DE PERGUNTAS UNIVERSAIS

```typescript
// frontend/src/components/Formulario/PerguntasUniversais.tsx
interface PerguntasUniversaisProps {
  onProximo: (dados: any) => void;
  onVoltar: () => void;
}

export const PerguntasUniversais: React.FC<PerguntasUniversaisProps> = ({ onProximo, onVoltar }) => {
  const [dados, setDados] = useState({
    faturamento_mensal: '',
    num_produtos: '',
    investimento_marketing: '',
    margem_lucro: '',
    num_pessoas: '',
    maior_gargalo: ''
  });

  const handleChange = (campo: string, valor: any) => {
    setDados(prev => ({ ...prev, [campo]: valor }));
  };

  const handleProximo = () => {
    // Validação
    if (!dados.faturamento_mensal || !dados.num_produtos || !dados.investimento_marketing) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }
    onProximo(dados);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Etapa 2 de 5: Informações Básicas</h2>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '40%' }}></div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Faturamento Mensal */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            💰 Qual é seu faturamento mensal?
          </label>
          <div className="space-y-2">
            {[
              { valor: 'ate_5k', label: 'Até R$ 5.000' },
              { valor: '5k_15k', label: 'R$ 5.000 - R$ 15.000' },
              { valor: '15k_50k', label: 'R$ 15.000 - R$ 50.000' },
              { valor: '50k_100k', label: 'R$ 50.000 - R$ 100.000' },
              { valor: 'acima_100k', label: 'Acima de R$ 100.000' }
            ].map((opcao) => (
              <label key={opcao.valor} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="faturamento"
                  value={opcao.valor}
                  checked={dados.faturamento_mensal === opcao.valor}
                  onChange={(e) => handleChange('faturamento_mensal', e.target.value)}
                  className="w-4 h-4"
                />
                <span className="ml-3 text-gray-700">{opcao.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Número de Produtos */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            📦 Quantos produtos você possui?
          </label>
          <input
            type="number"
            value={dados.num_produtos}
            onChange={(e) => handleChange('num_produtos', e.target.value)}
            placeholder="Ex: 3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
            max="999"
          />
        </div>

        {/* Investimento em Marketing */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            💸 Quanto você investe em marketing por mês?
          </label>
          <input
            type="number"
            value={dados.investimento_marketing}
            onChange={(e) => handleChange('investimento_marketing', e.target.value)}
            placeholder="R$ 0,00"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            step="100"
          />
        </div>

        {/* Margem de Lucro */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            📈 Qual é sua margem de lucro?
          </label>
          <div className="flex items-center">
            <input
              type="number"
              value={dados.margem_lucro}
              onChange={(e) => handleChange('margem_lucro', e.target.value)}
              placeholder="Ex: 35"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="100"
            />
            <span className="ml-2 text-gray-600">%</span>
          </div>
        </div>

        {/* Número de Pessoas */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            👥 Quantas pessoas trabalham com você?
          </label>
          <input
            type="number"
            value={dados.num_pessoas}
            onChange={(e) => handleChange('num_pessoas', e.target.value)}
            placeholder="Ex: 2"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
            max="999"
          />
        </div>

        {/* Maior Gargalo */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            🚧 Qual é seu maior gargalo?
          </label>
          <div className="space-y-2">
            {[
              'Falta de leads qualificados',
              'Baixa taxa de conversão',
              'Desorganização operacional',
              'Falta de capital/caixa',
              'Outro'
            ].map((opcao) => (
              <label key={opcao} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="gargalo"
                  value={opcao}
                  checked={dados.maior_gargalo === opcao}
                  onChange={(e) => handleChange('maior_gargalo', e.target.value)}
                  className="w-4 h-4"
                />
                <span className="ml-3 text-gray-700">{opcao}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button
          onClick={onVoltar}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition"
        >
          Voltar
        </button>
        <button
          onClick={handleProximo}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          Próximo
        </button>
      </div>
    </div>
  );
};
```

## 4. TELA DE METAS E PROJEÇÕES

```typescript
// frontend/src/components/Formulario/MetasProjecoes.tsx
interface MetasProjecoesProps {
  faturamentoAtual: number;
  onProximo: (dados: any) => void;
  onVoltar: () => void;
}

export const MetasProjecoes: React.FC<MetasProjecoesProps> = ({ faturamentoAtual, onProximo, onVoltar }) => {
  const [dados, setDados] = useState({
    meta_90_dias: '',
    meta_180_dias: '',
    meta_365_dias: ''
  });

  const [feedback, setFeedback] = useState<{ [key: string]: string }>({});

  const calcularCrescimento = (meta: number) => {
    if (!faturamentoAtual || !meta) return null;
    const crescimento = ((meta - faturamentoAtual) / faturamentoAtual) * 100;
    return crescimento.toFixed(1);
  };

  const handleChange = (campo: string, valor: string) => {
    setDados(prev => ({ ...prev, [campo]: valor }));

    const meta = parseFloat(valor);
    const crescimento = calcularCrescimento(meta);

    if (crescimento) {
      if (parseFloat(crescimento) > 300) {
        setFeedback(prev => ({
          ...prev,
          [campo]: '🔴 Metas parecem irrealistas. Verifique os valores.'
        }));
      } else if (parseFloat(crescimento) > 200) {
        setFeedback(prev => ({
          ...prev,
          [campo]: '⚠️ Suas metas parecem ambiciosas. Recomendamos revisar a estratégia.'
        }));
      } else {
        setFeedback(prev => ({
          ...prev,
          [campo]: `💡 Crescimento esperado: +${crescimento}%`
        }));
      }
    }
  };

  const handleProximo = () => {
    if (!dados.meta_90_dias || !dados.meta_180_dias || !dados.meta_365_dias) {
      alert('Por favor, preencha todas as metas');
      return;
    }

    const meta90 = parseFloat(dados.meta_90_dias);
    const meta180 = parseFloat(dados.meta_180_dias);
    const meta365 = parseFloat(dados.meta_365_dias);

    if (meta180 <= meta90 || meta365 <= meta180) {
      alert('As metas devem ser progressivas (90 < 180 < 365)');
      return;
    }

    onProximo(dados);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Etapa 3 de 5: Metas e Projeções</h2>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Meta 90 Dias */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            📅 Meta de faturamento para os próximos 90 dias
          </label>
          <input
            type="number"
            value={dados.meta_90_dias}
            onChange={(e) => handleChange('meta_90_dias', e.target.value)}
            placeholder="R$ 0,00"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            step="1000"
          />
          {feedback.meta_90_dias && (
            <p className="text-sm mt-2 text-gray-600">{feedback.meta_90_dias}</p>
          )}
        </div>

        {/* Meta 180 Dias */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            📅 Meta de faturamento para os próximos 180 dias
          </label>
          <input
            type="number"
            value={dados.meta_180_dias}
            onChange={(e) => handleChange('meta_180_dias', e.target.value)}
            placeholder="R$ 0,00"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            step="1000"
          />
          {feedback.meta_180_dias && (
            <p className="text-sm mt-2 text-gray-600">{feedback.meta_180_dias}</p>
          )}
        </div>

        {/* Meta 365 Dias */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            📅 Meta de faturamento para os próximos 365 dias
          </label>
          <input
            type="number"
            value={dados.meta_365_dias}
            onChange={(e) => handleChange('meta_365_dias', e.target.value)}
            placeholder="R$ 0,00"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            step="1000"
          />
          {feedback.meta_365_dias && (
            <p className="text-sm mt-2 text-gray-600">{feedback.meta_365_dias}</p>
          )}
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button
          onClick={onVoltar}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition"
        >
          Voltar
        </button>
        <button
          onClick={handleProximo}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          Próximo
        </button>
      </div>
    </div>
  );
};
```

## 5. TELA DE ESTRATÉGIAS

```typescript
// frontend/src/components/Formulario/Estrategias.tsx
interface EstrategiasProps {
  onProximo: (dados: any) => void;
  onVoltar: () => void;
}

const ESTRATEGIAS = [
  'Tráfego Pago (Google Ads, Meta Ads)',
  'Email Marketing',
  'SEO / Conteúdo Orgânico',
  'Indicações / Referências',
  'Parcerias Estratégicas',
  'Outbound / Prospecção Ativa',
  'Webinários / Eventos Online',
  'Programa de Afiliados',
  'Outro'
];

export const Estrategias: React.FC<EstrategiasProps> = ({ onProximo, onVoltar }) => {
  const [dados, setDados] = useState({
    estrategias_dominadas: [] as string[],
    estrategia_maior_retorno: '',
    estrategia_menor_retorno: '',
    aprendizados_texto: ''
  });

  const handleToggleEstrategia = (estrategia: string) => {
    setDados(prev => ({
      ...prev,
      estrategias_dominadas: prev.estrategias_dominadas.includes(estrategia)
        ? prev.estrategias_dominadas.filter(e => e !== estrategia)
        : [...prev.estrategias_dominadas, estrategia]
    }));
  };

  const handleProximo = () => {
    if (dados.estrategias_dominadas.length === 0) {
      alert('Por favor, selecione pelo menos uma estratégia');
      return;
    }

    if (!dados.estrategia_maior_retorno || !dados.estrategia_menor_retorno) {
      alert('Por favor, selecione as estratégias com maior e menor retorno');
      return;
    }

    if (dados.estrategia_maior_retorno === dados.estrategia_menor_retorno) {
      alert('As estratégias de maior e menor retorno devem ser diferentes');
      return;
    }

    onProximo(dados);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Etapa 4 de 5: Estratégias</h2>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '80%' }}></div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Estratégias Dominadas */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            🎯 Quais estratégias você domina ou aplica atualmente?
          </label>
          <div className="space-y-2">
            {ESTRATEGIAS.map((estrategia) => (
              <label key={estrategia} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={dados.estrategias_dominadas.includes(estrategia)}
                  onChange={() => handleToggleEstrategia(estrategia)}
                  className="w-4 h-4"
                />
                <span className="ml-3 text-gray-700">{estrategia}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Estratégia com Maior Retorno */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            ✅ Qual estratégia traz MAIOR retorno?
          </label>
          <div className="space-y-2">
            {dados.estrategias_dominadas.map((estrategia) => (
              <label key={estrategia} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="maior_retorno"
                  value={estrategia}
                  checked={dados.estrategia_maior_retorno === estrategia}
                  onChange={(e) => setDados(prev => ({ ...prev, estrategia_maior_retorno: e.target.value }))}
                  className="w-4 h-4"
                />
                <span className="ml-3 text-gray-700">{estrategia}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Estratégia com Menor Retorno */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            ❌ Qual estratégia traz MENOR retorno?
          </label>
          <div className="space-y-2">
            {dados.estrategias_dominadas.map((estrategia) => (
              <label key={estrategia} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="menor_retorno"
                  value={estrategia}
                  checked={dados.estrategia_menor_retorno === estrategia}
                  onChange={(e) => setDados(prev => ({ ...prev, estrategia_menor_retorno: e.target.value }))}
                  className="w-4 h-4"
                />
                <span className="ml-3 text-gray-700">{estrategia}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Aprendizados */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            📚 O que você já tentou fazer que NÃO funcionou?
          </label>
          <textarea
            value={dados.aprendizados_texto}
            onChange={(e) => setDados(prev => ({ ...prev, aprendizados_texto: e.target.value }))}
            placeholder="Descreva suas tentativas anteriores, fracassos e o que aprendeu com eles..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">{dados.aprendizados_texto.length}/500</p>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button
          onClick={onVoltar}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition"
        >
          Voltar
        </button>
        <button
          onClick={handleProximo}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          Próximo
        </button>
      </div>
    </div>
  );
};
```

---

# 🤖 SERVIÇOS DE IA - IMPLEMENTAÇÃO COMPLETA

## 1. IA Orchestrator (Orquestração de Múltiplos Motores)

```typescript
// backend/src/services/iaService.ts
import OpenAIService from './openaiService';
import ClaudeService from './claudeService';
import GeminiService from './geminiService';
import CohereService from './cohereService';
import MistralService from './mistralService';
import RAGService from './ragService';
import HallucinationDetector from './halluccinationDetector';
import FactChecker from './factChecker';
import ConfidenceScoring from './confidenceScoring';

interface ResultadoIA {
  resposta: string;
  motor: string;
  scoreConfianca: number;
  fontes: string[];
  custo: number;
  tokensUsados: number;
}

class IAService {
  private openai = new OpenAIService();
  private claude = new ClaudeService();
  private gemini = new GeminiService();
  private cohere = new CohereService();
  private mistral = new MistralService();
  private rag = new RAGService();
  private hallucDetector = new HallucinationDetector();
  private factChecker = new FactChecker();
  private confidenceScoring = new ConfidenceScoring();

  /**
   * Análise Profunda com IA Vertical (Fine-tuned)
   */
  async analisarComIAVertical(dados: any, contexto: any): Promise<ResultadoIA> {
    const tentativas = [
      { servico: 'openai', metodo: this.openai.analisarComIAVertical.bind(this.openai) },
      { servico: 'claude', metodo: this.claude.analisarProfundamente.bind(this.claude) },
      { servico: 'gemini', metodo: this.gemini.analisarRapido.bind(this.gemini) },
      { servico: 'mistral', metodo: this.mistral.analisar.bind(this.mistral) }
    ];

    for (const tentativa of tentativas) {
      try {
        console.log(`[IA] Tentando ${tentativa.servico} para análise...`);
        
        const resultado = await tentativa.metodo(dados, contexto);
        
        // Verificações de qualidade
        const verificacoes = await this.executarVerificacoes(resultado.resposta, dados);
        
        // Calcular score de confiança
        const scoreConfianca = await this.confidenceScoring.calcularScoreConfianca(
          resultado.resposta,
          verificacoes.conhecimentoUtilizado,
          verificacoes
        );

        // Log de auditoria
        await this.registrarOperacao({
          tipo: 'analise_ia_vertical',
          motor: tentativa.servico,
          entrada: JSON.stringify(dados),
          resposta: resultado.resposta,
          scoreConfianca: scoreConfianca.scoreTotal,
          scoreAlucinacao: verificacoes.alucinacao.scoreAlucinacao,
          fontes: verificacoes.conhecimentoUtilizado.map(k => k.fonte),
          verificacoes,
          status: scoreConfianca.recomendacao === 'USAR' ? 'aceita' : 'revisada'
        });

        if (scoreConfianca.recomendacao === 'USAR') {
          return {
            resposta: resultado.resposta,
            motor: tentativa.servico,
            scoreConfianca: scoreConfianca.scoreTotal,
            fontes: verificacoes.conhecimentoUtilizado.map(k => k.fonte),
            custo: resultado.custo,
            tokensUsados: resultado.tokensUsados
          };
        } else {
          console.warn(`[IA] ${tentativa.servico} retornou score baixo: ${scoreConfianca.scoreTotal}%`);
          continue;
        }
      } catch (erro) {
        console.error(`[IA] Erro com ${tentativa.servico}:`, erro);
        await this.registrarOperacao({
          tipo: 'analise_ia_vertical',
          motor: tentativa.servico,
          status: 'erro',
          erro: erro.message
        });
        continue;
      }
    }

    throw new Error('Todas as tentativas de IA falharam para análise profunda');
  }

  /**
   * Geração de Recomendações Personalizadas
   */
  async gerarRecomendacoes(analiseIA: any, fase: string, score: number): Promise<ResultadoIA> {
    try {
      // Recuperar conhecimento relevante via RAG
      const conhecimentoRelevante = await this.rag.recuperarConhecimento(
        `Recomendações para negócio em fase ${fase} com score ${score}`
      );

      // Gerar recomendações com IA
      const resultado = await this.openai.gerarRecomendacoes(analiseIA, fase, score, conhecimentoRelevante);

      // Verificações
      const verificacoes = await this.executarVerificacoes(resultado.resposta, analiseIA);

      // Score de confiança
      const scoreConfianca = await this.confidenceScoring.calcularScoreConfianca(
        resultado.resposta,
        conhecimentoRelevante,
        verificacoes
      );

      return {
        resposta: resultado.resposta,
        motor: 'openai',
        scoreConfianca: scoreConfianca.scoreTotal,
        fontes: conhecimentoRelevante.map(k => k.fonte),
        custo: resultado.custo,
        tokensUsados: resultado.tokensUsados
      };
    } catch (erro) {
      console.error('[IA] Erro ao gerar recomendações:', erro);
      throw erro;
    }
  }

  /**
   * Plano de Ação Inteligente
   */
  async gerarPlanoAcao(analiseIA: any, metas: any): Promise<ResultadoIA> {
    try {
      const resultado = await this.openai.gerarPlanoAcao(analiseIA, metas);

      const verificacoes = await this.executarVerificacoes(resultado.resposta, analiseIA);

      const scoreConfianca = await this.confidenceScoring.calcularScoreConfianca(
        resultado.resposta,
        [],
        verificacoes
      );

      return {
        resposta: resultado.resposta,
        motor: 'openai',
        scoreConfianca: scoreConfianca.scoreTotal,
        fontes: [],
        custo: resultado.custo,
        tokensUsados: resultado.tokensUsados
      };
    } catch (erro) {
      console.error('[IA] Erro ao gerar plano de ação:', erro);
      throw erro;
    }
  }

  /**
   * Chat Interativo com Contexto
   */
  async responderChat(mensagem: string, contexto: any): Promise<ResultadoIA> {
    try {
      // Recuperar conhecimento relevante
      const conhecimentoRelevante = await this.rag.recuperarConhecimento(mensagem);

      // Gerar resposta com contexto
      const resultado = await this.openai.responderChat(mensagem, contexto, conhecimentoRelevante);

      // Verificações
      const verificacoes = await this.executarVerificacoes(resultado.resposta, contexto);

      // Score de confiança
      const scoreConfianca = await this.confidenceScoring.calcularScoreConfianca(
        resultado.resposta,
        conhecimentoRelevante,
        verificacoes
      );

      return {
        resposta: resultado.resposta,
        motor: 'openai',
        scoreConfianca: scoreConfianca.scoreTotal,
        fontes: conhecimentoRelevante.map(k => k.fonte),
        custo: resultado.custo,
        tokensUsados: resultado.tokensUsados
      };
    } catch (erro) {
      console.error('[IA] Erro ao responder chat:', erro);
      throw erro;
    }
  }

  /**
   * Geração de Relatório em PDF com IA
   */
  async gerarRelatorioPDF(diagnostico: any): Promise<{ url: string; custo: number }> {
    try {
      // Redação de conteúdo com IA
      const conteudoRedatado = await this.openai.redacaoPDF(diagnostico);

      // Gerar PDF
      const urlPDF = await this.openai.gerarPDF(conteudoRedatado, diagnostico.id);

      return {
        url: urlPDF,
        custo: 0.50 // Custo estimado
      };
    } catch (erro) {
      console.error('[IA] Erro ao gerar PDF:', erro);
      throw erro;
    }
  }

  /**
   * Executar Verificações de Qualidade
   */
  private async executarVerificacoes(resposta: string, contexto: any) {
    const [alucinacao, fatos, benchmarks] = await Promise.all([
      this.hallucDetector.detectarAlucinacao(resposta, contexto),
      this.factChecker.verificar(resposta),
      this.hallucDetector.verificarBenchmarks(resposta)
    ]);

    return {
      alucinacao,
      fatos,
      benchmarks,
      conhecimentoUtilizado: await this.rag.recuperarConhecimento(resposta)
    };
  }

  /**
   * Registrar Operação em Auditoria
   */
  private async registrarOperacao(dados: any) {
    // Implementar logging em banco de dados
    console.log('[AUDITORIA]', dados);
  }
}

export default new IAService();
```

---

# 📊 ENDPOINTS DA API COMPLETOS

## Autenticação

```typescript
// POST /api/auth/register
interface RegisterRequest {
  email: string;
  senha: string;
  nome: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    nome: string;
    tipo_usuario: 'lead' | 'admin';
  };
}

// POST /api/auth/login
interface LoginRequest {
  email: string;
  senha: string;
}

// POST /api/auth/refresh
// Retorna novo token

// POST /api/auth/logout
// Invalida sessão
```

## Diagnósticos

```typescript
// POST /api/diagnosticos
interface CriarDiagnosticoRequest {
  nicho: string;
}

interface CriarDiagnosticoResponse {
  diagnostico_id: string;
  status: 'em_progresso';
}

// PUT /api/diagnosticos/:id
interface AtualizarDiagnosticoRequest {
  faturamento_mensal?: string;
  num_produtos?: number;
  investimento_marketing?: number;
  // ... outros campos
}

interface AtualizarDiagnosticoResponse {
  diagnostico_id: string;
  status: 'em_progresso' | 'concluido';
}

// POST /api/diagnosticos/:id/finalizar
interface FinalizarDiagnosticoResponse {
  score_geral: number;
  quadrante: string;
  recomendacao_principal: string;
  oportunidades: string[];
  desafios: string[];
  scoreConfianca: number;
}

// GET /api/diagnosticos/:id
interface DiagnosticoCompleto {
  id: string;
  nicho: string;
  score_geral: number;
  // ... todos os dados
}

// GET /api/diagnosticos
interface ListaDiagnosticos {
  diagnosticos: DiagnosticoCompleto[];
  total: number;
  pagina: number;
}
```

## Chat

```typescript
// POST /api/chat/responder
interface ChatRequest {
  diagnostico_id: string;
  mensagem: string;
  historico?: ChatMessage[];
}

interface ChatResponse {
  resposta: string;
  scoreConfianca: number;
  fontes: string[];
}

// GET /api/chat/historico/:diagnostico_id
interface HistoricoChat {
  mensagens: ChatMessage[];
  total: number;
}
```

## Relatórios

```typescript
// POST /api/relatorios/:diagnostico_id/gerar
interface GerarRelatoriRequest {
  incluir_analise_detalhada?: boolean;
  incluir_plano_acao?: boolean;
}

interface GerarRelatoriResponse {
  url_pdf: string;
  status: 'gerado';
  data_geracao: string;
}

// GET /api/relatorios/:diagnostico_id
interface RelatorioInfo {
  id: string;
  url_pdf: string;
  status: 'gerado' | 'enviado' | 'visualizado';
  data_geracao: string;
}

// POST /api/relatorios/:id/enviar-email
interface EnviarEmailRequest {
  email_destinatario: string;
  mensagem?: string;
}

interface EnviarEmailResponse {
  status: 'enviado';
  data_envio: string;
}
```

## Admin

```typescript
// GET /api/admin/diagnosticos
interface AdminListaRequest {
  nicho?: string;
  status?: string;
  score_min?: number;
  score_max?: number;
  data_inicio?: string;
  data_fim?: string;
  pagina?: number;
  limite?: number;
}

interface AdminListaResponse {
  diagnosticos: {
    id: string;
    cliente_nome: string;
    nicho: string;
    score: number;
    quadrante: string;
    data_criacao: string;
    status: string;
  }[];
  total: number;
  pagina: number;
}

// GET /api/admin/qualidade/metricas
interface MetricasQualidade {
  scoreConfiancaMedia: number;
  percentualAlucinacoes: number;
  percentualRespostasAceitas: number;
  fontesUtilizadas: number;
  operacoesAuditadas: number;
}

// GET /api/admin/auditoria/diagnosticos/:id
interface AuditoriaResponse {
  diagnostico_id: string;
  total_operacoes: number;
  operacoes_aceitas: number;
  operacoes_rejeitadas: number;
  logs: AuditLog[];
}
```

---

# ✅ CHECKLIST FINAL DE DESENVOLVIMENTO

## Fase 1: Setup Inicial (1 semana)
- [ ] Criar repositório Git
- [ ] Configurar estrutura de pastas
- [ ] Instalar dependências (React, Express, PostgreSQL, etc.)
- [ ] Configurar variáveis de ambiente
- [ ] Criar banco de dados e executar migrations
- [ ] Configurar autenticação JWT

## Fase 2: Frontend - Autenticação (1 semana)
- [ ] Implementar LoginPage
- [ ] Implementar RegisterForm
- [ ] Implementar ProtectedRoute
- [ ] Testar fluxo de autenticação
- [ ] Implementar logout

## Fase 3: Frontend - Formulário (2 semanas)
- [ ] Implementar SeletorNicho
- [ ] Implementar PerguntasUniversais
- [ ] Implementar MetasProjecoes
- [ ] Implementar Estrategias
- [ ] Implementar PerguntasEspecificas (3 nichos)
- [ ] Implementar salvamento automático
- [ ] Testes de validação

## Fase 4: Backend - APIs Básicas (1 semana)
- [ ] Implementar endpoints de autenticação
- [ ] Implementar endpoints de diagnósticos (CRUD)
- [ ] Implementar salvamento de formulário
- [ ] Testes de integração

## Fase 5: IA - Integração de Motores (2 semanas)
- [ ] Integrar OpenAI API
- [ ] Integrar Anthropic Claude API
- [ ] Integrar Google Gemini API
- [ ] Integrar Cohere API
- [ ] Integrar Mistral API
- [ ] Implementar IAOrchestrator com fallback
- [ ] Testes de cada motor

## Fase 6: IA - Anti-Alucinação (2 semanas)
- [ ] Implementar HallucinationDetector
- [ ] Implementar FactChecker
- [ ] Implementar ConfidenceScoring
- [ ] Testes rigorosos de detecção
- [ ] Calibração de thresholds

## Fase 7: IA - RAG (1 semana)
- [ ] Configurar Pinecone
- [ ] Implementar RAGService
- [ ] Popular base de conhecimento (500+ fontes)
- [ ] Testes de busca semântica

## Fase 8: Backend - Análise com IA (2 semanas)
- [ ] Implementar análise profunda
- [ ] Implementar geração de recomendações
- [ ] Implementar geração de plano de ação
- [ ] Implementar análise de aprendizados
- [ ] Testes de qualidade

## Fase 9: Frontend - Resultado (1 semana)
- [ ] Implementar ResultadoPreview
- [ ] Implementar ScoreDisplay
- [ ] Implementar RecomendacaoCard
- [ ] Implementar OportunidadesDesafios
- [ ] Implementar RespostaComConfianca

## Fase 10: Chat Interativo (1 semana)
- [ ] Implementar ChatIA component
- [ ] Implementar endpoint de chat
- [ ] Implementar histórico de chat
- [ ] Testes de interação

## Fase 11: Geração de PDF (1 semana)
- [ ] Implementar template HTML
- [ ] Integrar Puppeteer
- [ ] Implementar redação com IA
- [ ] Testes de qualidade visual

## Fase 12: Dashboard Admin (2 semanas)
- [ ] Implementar DashboardAdmin
- [ ] Implementar PipelineKanban
- [ ] Implementar FiltrosAvancados
- [ ] Implementar AcoesRapidas
- [ ] Implementar dashboard de qualidade

## Fase 13: Auditoria (1 semana)
- [ ] Implementar AuditLog completo
- [ ] Implementar rastreabilidade
- [ ] Implementar relatórios de auditoria
- [ ] Testes de integridade

## Fase 14: Monitoramento (1 semana)
- [ ] Integrar Datadog
- [ ] Integrar Sentry
- [ ] Implementar alertas
- [ ] Dashboard de custos

## Fase 15: Testes (2 semanas)
- [ ] Testes unitários (95%+ cobertura)
- [ ] Testes de integração
- [ ] Testes de qualidade de IA
- [ ] Testes de segurança
- [ ] Testes de performance

## Fase 16: Deploy (1 semana)
- [ ] Deploy em staging
- [ ] Testes finais
- [ ] Deploy em produção
- [ ] Monitoramento 24/7

**TOTAL: 24-28 semanas (6-7 meses)**

---

# 🎯 CONCLUSÃO

Este é o **PROMPT FINAL MEGA-COMPLETO** para o Lovable construir um sistema de diagnóstico de negócios com:

✅ **IA Vertical Enterprise-Grade** - Fine-tuned e especializada  
✅ **5 Motores de IA com Fallback** - Redundância total  
✅ **Anti-Alucinação Rigorosa** - Zero alucinações  
✅ **RAG Inteligente** - Base de conhecimento verificada  
✅ **Scoring de Confiança** - Transparência total  
✅ **Auditoria Completa** - Rastreabilidade 100%  
✅ **Dashboard Admin** - Gestão completa  
✅ **Relatórios em PDF** - Profissionais e personalizados  
✅ **Chat Interativo** - IA contextualizada  
✅ **Conformidade Enterprise** - GDPR, CCPA, SOC2  

**Qualidade: Pronta para Produção**
**Tempo: 6-7 meses de desenvolvimento**
**Custo: ~$600/mês em APIs de IA**

Boa sorte com o desenvolvimento! 🚀
