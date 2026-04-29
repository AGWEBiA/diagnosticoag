export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          acao: string
          created_at: string
          entidade: string | null
          entidade_id: string | null
          id: string
          ip: string | null
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          entidade?: string | null
          entidade_id?: string | null
          id?: string
          ip?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          entidade?: string | null
          entidade_id?: string | null
          id?: string
          ip?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_trail_ia: {
        Row: {
          confianca: number | null
          contexto_rag: Json | null
          created_at: string
          diagnostico_id: string | null
          flag_motivo: string | null
          flagged: boolean
          id: string
          modelo: string | null
          prompt: string
          resposta: string
          user_id: string | null
        }
        Insert: {
          confianca?: number | null
          contexto_rag?: Json | null
          created_at?: string
          diagnostico_id?: string | null
          flag_motivo?: string | null
          flagged?: boolean
          id?: string
          modelo?: string | null
          prompt: string
          resposta: string
          user_id?: string | null
        }
        Update: {
          confianca?: number | null
          contexto_rag?: Json | null
          created_at?: string
          diagnostico_id?: string | null
          flag_motivo?: string | null
          flagged?: boolean
          id?: string
          modelo?: string | null
          prompt?: string
          resposta?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_trail_ia_diagnostico_id_fkey"
            columns: ["diagnostico_id"]
            isOneToOne: false
            referencedRelation: "diagnosticos"
            referencedColumns: ["id"]
          },
        ]
      }
      creditos_diagnostico: {
        Row: {
          comissao_afiliado_centavos: number | null
          comissao_coprodutor_centavos: number | null
          comissao_produtor_centavos: number | null
          consumido_em: string | null
          created_at: string
          diagnostico_id: string | null
          email_comprador: string | null
          estornado_em: string | null
          estorno_motivo: string | null
          id: string
          metadata: Json | null
          moeda: string | null
          origem: string
          produto_id: string | null
          taxa_gateway_centavos: number | null
          transacao_externa_id: string | null
          user_id: string
          valor_bruto_centavos: number | null
          valor_liquido_centavos: number | null
        }
        Insert: {
          comissao_afiliado_centavos?: number | null
          comissao_coprodutor_centavos?: number | null
          comissao_produtor_centavos?: number | null
          consumido_em?: string | null
          created_at?: string
          diagnostico_id?: string | null
          email_comprador?: string | null
          estornado_em?: string | null
          estorno_motivo?: string | null
          id?: string
          metadata?: Json | null
          moeda?: string | null
          origem: string
          produto_id?: string | null
          taxa_gateway_centavos?: number | null
          transacao_externa_id?: string | null
          user_id: string
          valor_bruto_centavos?: number | null
          valor_liquido_centavos?: number | null
        }
        Update: {
          comissao_afiliado_centavos?: number | null
          comissao_coprodutor_centavos?: number | null
          comissao_produtor_centavos?: number | null
          consumido_em?: string | null
          created_at?: string
          diagnostico_id?: string | null
          email_comprador?: string | null
          estornado_em?: string | null
          estorno_motivo?: string | null
          id?: string
          metadata?: Json | null
          moeda?: string | null
          origem?: string
          produto_id?: string | null
          taxa_gateway_centavos?: number | null
          transacao_externa_id?: string | null
          user_id?: string
          valor_bruto_centavos?: number | null
          valor_liquido_centavos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "creditos_diagnostico_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos_pagamento"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostico_aprovacoes: {
        Row: {
          admin_id: string
          created_at: string
          decisao: string
          diagnostico_id: string
          id: string
          motivo: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string
          decisao: string
          diagnostico_id: string
          id?: string
          motivo?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string
          decisao?: string
          diagnostico_id?: string
          id?: string
          motivo?: string | null
        }
        Relationships: []
      }
      diagnosticos: {
        Row: {
          analise: Json | null
          aprovado_em: string | null
          aprovado_por: string | null
          bloqueado_em: string | null
          bloqueado_por: string | null
          bloqueio_motivo: string | null
          concluido_em: string | null
          confianca_score: number | null
          created_at: string
          empresa_nome: string | null
          enviado_em: string | null
          id: string
          liberado_em: string | null
          notas_admin: string | null
          rag_contexto: Json | null
          recomendacoes: Json | null
          requer_aprovacao: boolean | null
          respostas: Json
          resumo_executivo: string | null
          score: number | null
          segmento: string | null
          sla_horas: number | null
          status: Database["public"]["Enums"]["diagnostico_status"]
          status_anterior_bloqueio:
            | Database["public"]["Enums"]["diagnostico_status"]
            | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analise?: Json | null
          aprovado_em?: string | null
          aprovado_por?: string | null
          bloqueado_em?: string | null
          bloqueado_por?: string | null
          bloqueio_motivo?: string | null
          concluido_em?: string | null
          confianca_score?: number | null
          created_at?: string
          empresa_nome?: string | null
          enviado_em?: string | null
          id?: string
          liberado_em?: string | null
          notas_admin?: string | null
          rag_contexto?: Json | null
          recomendacoes?: Json | null
          requer_aprovacao?: boolean | null
          respostas?: Json
          resumo_executivo?: string | null
          score?: number | null
          segmento?: string | null
          sla_horas?: number | null
          status?: Database["public"]["Enums"]["diagnostico_status"]
          status_anterior_bloqueio?:
            | Database["public"]["Enums"]["diagnostico_status"]
            | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analise?: Json | null
          aprovado_em?: string | null
          aprovado_por?: string | null
          bloqueado_em?: string | null
          bloqueado_por?: string | null
          bloqueio_motivo?: string | null
          concluido_em?: string | null
          confianca_score?: number | null
          created_at?: string
          empresa_nome?: string | null
          enviado_em?: string | null
          id?: string
          liberado_em?: string | null
          notas_admin?: string | null
          rag_contexto?: Json | null
          recomendacoes?: Json | null
          requer_aprovacao?: boolean | null
          respostas?: Json
          resumo_executivo?: string | null
          score?: number | null
          segmento?: string | null
          sla_horas?: number | null
          status?: Database["public"]["Enums"]["diagnostico_status"]
          status_anterior_bloqueio?:
            | Database["public"]["Enums"]["diagnostico_status"]
            | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      interacoes_chat: {
        Row: {
          content: string
          created_at: string
          diagnostico_id: string
          id: string
          modelo: string | null
          rag_contexto: Json | null
          role: string
          tokens_input: number | null
          tokens_output: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          diagnostico_id: string
          id?: string
          modelo?: string | null
          rag_contexto?: Json | null
          role: string
          tokens_input?: number | null
          tokens_output?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          diagnostico_id?: string
          id?: string
          modelo?: string | null
          rag_contexto?: Json | null
          role?: string
          tokens_input?: number | null
          tokens_output?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interacoes_chat_diagnostico_id_fkey"
            columns: ["diagnostico_id"]
            isOneToOne: false
            referencedRelation: "diagnosticos"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          categoria: string | null
          conteudo: string
          created_at: string
          created_by: string | null
          embedding: string | null
          fonte: string | null
          id: string
          status: Database["public"]["Enums"]["knowledge_status"]
          tags: string[] | null
          titulo: string
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          conteudo: string
          created_at?: string
          created_by?: string | null
          embedding?: string | null
          fonte?: string | null
          id?: string
          status?: Database["public"]["Enums"]["knowledge_status"]
          tags?: string[] | null
          titulo: string
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          conteudo?: string
          created_at?: string
          created_by?: string | null
          embedding?: string | null
          fonte?: string | null
          id?: string
          status?: Database["public"]["Enums"]["knowledge_status"]
          tags?: string[] | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_validacao: {
        Row: {
          comentario: string | null
          created_at: string
          decisao: Database["public"]["Enums"]["knowledge_status"]
          id: string
          knowledge_id: string
          validado_por: string | null
        }
        Insert: {
          comentario?: string | null
          created_at?: string
          decisao: Database["public"]["Enums"]["knowledge_status"]
          id?: string
          knowledge_id: string
          validado_por?: string | null
        }
        Update: {
          comentario?: string | null
          created_at?: string
          decisao?: Database["public"]["Enums"]["knowledge_status"]
          id?: string
          knowledge_id?: string
          validado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_validacao_knowledge_id_fkey"
            columns: ["knowledge_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base"
            referencedColumns: ["id"]
          },
        ]
      }
      operacoes_ia: {
        Row: {
          created_at: string
          custo_usd: number | null
          diagnostico_id: string | null
          duracao_ms: number | null
          erro: string | null
          id: string
          modelo: string | null
          provider: string | null
          sucesso: boolean
          tipo: string
          tokens_input: number | null
          tokens_output: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          custo_usd?: number | null
          diagnostico_id?: string | null
          duracao_ms?: number | null
          erro?: string | null
          id?: string
          modelo?: string | null
          provider?: string | null
          sucesso?: boolean
          tipo: string
          tokens_input?: number | null
          tokens_output?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          custo_usd?: number | null
          diagnostico_id?: string | null
          duracao_ms?: number | null
          erro?: string | null
          id?: string
          modelo?: string | null
          provider?: string | null
          sucesso?: boolean
          tipo?: string
          tokens_input?: number | null
          tokens_output?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operacoes_ia_diagnostico_id_fkey"
            columns: ["diagnostico_id"]
            isOneToOne: false
            referencedRelation: "diagnosticos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos_pagamento: {
        Row: {
          ativo: boolean
          checkout_url: string | null
          created_at: string
          creditos_concedidos: number
          descricao: string | null
          gateway: string
          id: string
          moeda: string | null
          nome: string
          oferta_externa_id: string | null
          pdf_disponivel_apos_dias: number
          preco_centavos: number | null
          produto_externo_id: string
          requer_aprovacao: boolean
          sla_horas: number
          taxa_gateway_pct: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          checkout_url?: string | null
          created_at?: string
          creditos_concedidos?: number
          descricao?: string | null
          gateway: string
          id?: string
          moeda?: string | null
          nome: string
          oferta_externa_id?: string | null
          pdf_disponivel_apos_dias?: number
          preco_centavos?: number | null
          produto_externo_id: string
          requer_aprovacao?: boolean
          sla_horas?: number
          taxa_gateway_pct?: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          checkout_url?: string | null
          created_at?: string
          creditos_concedidos?: number
          descricao?: string | null
          gateway?: string
          id?: string
          moeda?: string | null
          nome?: string
          oferta_externa_id?: string | null
          pdf_disponivel_apos_dias?: number
          preco_centavos?: number | null
          produto_externo_id?: string
          requer_aprovacao?: boolean
          sla_horas?: number
          taxa_gateway_pct?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      relatorios_pdf: {
        Row: {
          created_at: string
          diagnostico_id: string
          id: string
          storage_path: string
          tamanho_bytes: number | null
          user_id: string
          versao: number
        }
        Insert: {
          created_at?: string
          diagnostico_id: string
          id?: string
          storage_path: string
          tamanho_bytes?: number | null
          user_id: string
          versao?: number
        }
        Update: {
          created_at?: string
          diagnostico_id?: string
          id?: string
          storage_path?: string
          tamanho_bytes?: number | null
          user_id?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "relatorios_pdf_diagnostico_id_fkey"
            columns: ["diagnostico_id"]
            isOneToOne: false
            referencedRelation: "diagnosticos"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aprovar_diagnostico: {
        Args: { _diagnostico_id: string; _notas?: string }
        Returns: undefined
      }
      bloquear_diagnostico: {
        Args: { _diagnostico_id: string; _motivo: string }
        Returns: undefined
      }
      bloquear_por_transacao_estornada: {
        Args: { _motivo: string; _transacao_id: string }
        Returns: number
      }
      consumir_credito_diagnostico: {
        Args: { _diagnostico_id: string }
        Returns: boolean
      }
      creditos_disponiveis: { Args: { _user_id: string }; Returns: number }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      desbloquear_diagnostico: {
        Args: { _diagnostico_id: string }
        Returns: undefined
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      liberar_diagnosticos_pendentes: {
        Args: never
        Returns: {
          diagnostico_id: string
          email: string
          user_id: string
        }[]
      }
      match_knowledge: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          categoria: string
          conteudo: string
          fonte: string
          id: string
          similarity: number
          titulo: string
        }[]
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      reprovar_diagnostico: {
        Args: { _diagnostico_id: string; _motivo: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      diagnostico_status:
        | "rascunho"
        | "em_analise"
        | "concluido"
        | "arquivado"
        | "aguardando_aprovacao"
        | "liberado"
        | "reprovado"
        | "bloqueado"
      knowledge_status: "pendente" | "aprovado" | "rejeitado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      diagnostico_status: [
        "rascunho",
        "em_analise",
        "concluido",
        "arquivado",
        "aguardando_aprovacao",
        "liberado",
        "reprovado",
        "bloqueado",
      ],
      knowledge_status: ["pendente", "aprovado", "rejeitado"],
    },
  },
} as const
