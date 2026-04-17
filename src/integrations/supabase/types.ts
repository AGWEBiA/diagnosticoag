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
          consumido_em: string | null
          created_at: string
          diagnostico_id: string | null
          email_comprador: string | null
          id: string
          metadata: Json | null
          origem: string
          produto_id: string | null
          transacao_externa_id: string | null
          user_id: string
        }
        Insert: {
          consumido_em?: string | null
          created_at?: string
          diagnostico_id?: string | null
          email_comprador?: string | null
          id?: string
          metadata?: Json | null
          origem: string
          produto_id?: string | null
          transacao_externa_id?: string | null
          user_id: string
        }
        Update: {
          consumido_em?: string | null
          created_at?: string
          diagnostico_id?: string | null
          email_comprador?: string | null
          id?: string
          metadata?: Json | null
          origem?: string
          produto_id?: string | null
          transacao_externa_id?: string | null
          user_id?: string
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
      diagnosticos: {
        Row: {
          concluido_em: string | null
          confianca_score: number | null
          created_at: string
          empresa_nome: string | null
          id: string
          rag_contexto: Json | null
          recomendacoes: Json | null
          respostas: Json
          resumo_executivo: string | null
          score: number | null
          segmento: string | null
          status: Database["public"]["Enums"]["diagnostico_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          concluido_em?: string | null
          confianca_score?: number | null
          created_at?: string
          empresa_nome?: string | null
          id?: string
          rag_contexto?: Json | null
          recomendacoes?: Json | null
          respostas?: Json
          resumo_executivo?: string | null
          score?: number | null
          segmento?: string | null
          status?: Database["public"]["Enums"]["diagnostico_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          concluido_em?: string | null
          confianca_score?: number | null
          created_at?: string
          empresa_nome?: string | null
          id?: string
          rag_contexto?: Json | null
          recomendacoes?: Json | null
          respostas?: Json
          resumo_executivo?: string | null
          score?: number | null
          segmento?: string | null
          status?: Database["public"]["Enums"]["diagnostico_status"]
          updated_at?: string
          user_id?: string
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
          preco_centavos: number | null
          produto_externo_id: string
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
          preco_centavos?: number | null
          produto_externo_id: string
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
          preco_centavos?: number | null
          produto_externo_id?: string
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
      consumir_credito_diagnostico: {
        Args: { _diagnostico_id: string }
        Returns: boolean
      }
      creditos_disponiveis: { Args: { _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      diagnostico_status: "rascunho" | "em_analise" | "concluido" | "arquivado"
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
      diagnostico_status: ["rascunho", "em_analise", "concluido", "arquivado"],
      knowledge_status: ["pendente", "aprovado", "rejeitado"],
    },
  },
} as const
