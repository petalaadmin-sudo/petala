// types/database.ts
// Gerado via: supabase gen types typescript --local
// Atualize sempre que alterar o schema: npm run db:types

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type UserRole = 'user' | 'creator' | 'admin'
export type SessionType = 'text' | 'video'
export type TransactionType = 'purchase' | 'spend' | 'gift_sent' | 'gift_received' | 'payout' | 'bonus'
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string                    // uuid — mesmo ID do Supabase Auth
          email: string
          role: UserRole
          username: string | null
          balance_petals: number        // saldo atual em pétalas
          vip_until: string | null      // timestamp do VIP global
          age_confirmed: boolean        // confirmou ter 18+
          age_confirmed_at: string | null
          pwa_installed: boolean
          onesignal_player_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }

      creators: {
        Row: {
          id: string
          user_id: string               // FK → users.id
          name: string
          bio: string | null
          photo_url: string | null      // foto principal (R2)
          verified: boolean             // passou pela verificação de ID
          verified_at: string | null
          active: boolean               // perfil visível no feed
          price_text_petals: number     // pétalas por minuto de chat texto
          price_video_petals: number    // pétalas por minuto de chat vídeo
          rating: number                // média de avaliações (0-5)
          rating_count: number
          total_gifts: number           // total de presentes recebidos
          total_earnings_petals: number
          rank_weekly: number | null    // posição no ranking semanal
          rank_updated_at: string | null
          pix_key: string | null        // chave Pix para saque
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['creators']['Row'], 'created_at' | 'updated_at' | 'rating' | 'rating_count' | 'total_gifts' | 'total_earnings_petals'>
        Update: Partial<Database['public']['Tables']['creators']['Insert']>
      }

      album_photos: {
        Row: {
          id: string
          creator_id: string            // FK → creators.id
          r2_key: string                // chave no bucket R2
          r2_key_blur: string | null    // versão blurred para preview
          blur_hash: string | null      // blurhash para placeholder CSS
          is_free: boolean              // foto gratuita (preview)
          price_petals: number          // 0 se grátis
          unlock_count: number          // quantas vezes foi desbloqueada
          sort_order: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['album_photos']['Row'], 'created_at' | 'unlock_count'>
        Update: Partial<Database['public']['Tables']['album_photos']['Insert']>
      }

      photo_unlocks: {
        Row: {
          id: string
          user_id: string               // FK → users.id
          photo_id: string              // FK → album_photos.id
          petals_spent: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['photo_unlocks']['Row'], 'created_at'>
        Update: never
      }

      chat_sessions: {
        Row: {
          id: string
          user_id: string
          creator_id: string
          type: SessionType
          daily_room_name: string | null  // nome da sala Daily.co
          started_at: string
          ended_at: string | null
          duration_seconds: number | null
          petals_charged: number
          rating: number | null           // avaliação do usuário (1-5)
          rating_comment: string | null
        }
        Insert: Omit<Database['public']['Tables']['chat_sessions']['Row'], 'started_at'>
        Update: Partial<Database['public']['Tables']['chat_sessions']['Insert']>
      }

      gifts: {
        Row: {
          id: string
          from_user_id: string
          to_creator_id: string
          session_id: string | null
          gift_type: string             // 'heart' | 'rose' | 'diamond' | etc
          gift_emoji: string
          petals_spent: number
          creator_petals_earned: number // 70% do gasto
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['gifts']['Row'], 'created_at'>
        Update: never
      }

      transactions: {
        Row: {
          id: string
          user_id: string
          type: TransactionType
          petals_delta: number          // positivo = crédito, negativo = débito
          balance_after: number
          amount_brl: number | null     // valor em reais (compras)
          gateway_id: string | null     // ID da transação no gateway
          ref_id: string | null         // ID do objeto relacionado
          status: TransactionStatus
          metadata: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
      }

      petal_packages: {
        Row: {
          id: string
          name: string                  // 'Semente' | 'Buquê' | 'Jardim' | 'Paraíso'
          petals: number                // pétalas base
          bonus_petals: number          // pétalas bônus
          price_brl: number             // preço em reais
          active: boolean
          sort_order: number
        }
        Insert: Omit<Database['public']['Tables']['petal_packages']['Row'], never>
        Update: Partial<Database['public']['Tables']['petal_packages']['Insert']>
      }

      vip_subscriptions: {
        Row: {
          id: string
          user_id: string
          creator_id: string            // VIP por criadora específica
          starts_at: string
          ends_at: string
          price_brl: number
          gateway_id: string | null
          active: boolean
        }
        Insert: Omit<Database['public']['Tables']['vip_subscriptions']['Row'], never>
        Update: Partial<Database['public']['Tables']['vip_subscriptions']['Insert']>
      }
    }

    Views: {
      creator_rankings: {
        Row: {
          creator_id: string
          name: string
          photo_url: string | null
          total_gifts_week: number
          total_gifts_month: number
          rank_week: number
          rank_month: number
          online: boolean
        }
      }
    }

    Functions: {
      spend_petals: {
        Args: { p_user_id: string; p_amount: number; p_type: TransactionType; p_ref_id?: string }
        Returns: { success: boolean; new_balance: number; error?: string }
      }
      credit_petals: {
        Args: { p_user_id: string; p_amount: number; p_type: TransactionType; p_ref_id?: string }
        Returns: { success: boolean; new_balance: number }
      }
      send_gift: {
        Args: { p_from_user: string; p_to_creator: string; p_gift_type: string; p_petals: number }
        Returns: { success: boolean; gift_id: string; error?: string }
      }
    }
  }
}
