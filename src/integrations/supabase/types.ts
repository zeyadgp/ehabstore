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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      banners: {
        Row: {
          badge: string | null
          created_at: string
          cta_label: string | null
          cta_url: string | null
          id: string
          image: string | null
          is_active: boolean
          placement: string
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          badge?: string | null
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          id?: string
          image?: string | null
          is_active?: boolean
          placement?: string
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          badge?: string | null
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          id?: string
          image?: string | null
          is_active?: boolean
          placement?: string
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          cover_image: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          image: string | null
          is_active: boolean
          kind: string
          name: string
          parent_id: string | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          slug: string
          smart_rule: Json | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image?: string | null
          is_active?: boolean
          kind?: string
          name: string
          parent_id?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug: string
          smart_rule?: Json | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image?: string | null
          is_active?: boolean
          kind?: string
          name?: string
          parent_id?: string | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug?: string
          smart_rule?: Json | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          code: string
          coupon_id: string
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          discount_amount: number
          id: string
          order_id: string | null
          order_number: number | null
          order_total: number
        }
        Insert: {
          code: string
          coupon_id: string
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number
          id?: string
          order_id?: string | null
          order_number?: number | null
          order_total?: number
        }
        Update: {
          code?: string
          coupon_id?: string
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number
          id?: string
          order_id?: string | null
          order_number?: number | null
          order_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "discount_coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      currencies: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          rate: number
          sort_order: number
          symbol: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          rate?: number
          sort_order?: number
          symbol: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          rate?: number
          sort_order?: number
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      delivery_zones: {
        Row: {
          created_at: string
          fee: number
          governorate: string
          id: string
          is_active: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          fee?: number
          governorate: string
          id?: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          fee?: number
          governorate?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      discount_coupons: {
        Row: {
          code: string
          commission_percent: number
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_order: number
          owner_name: string | null
          owner_phone: string | null
          starts_at: string | null
          updated_at: string
          used_count: number
        }
        Insert: {
          code: string
          commission_percent?: number
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order?: number
          owner_name?: string | null
          owner_phone?: string | null
          starts_at?: string | null
          updated_at?: string
          used_count?: number
        }
        Update: {
          code?: string
          commission_percent?: number
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order?: number
          owner_name?: string | null
          owner_phone?: string | null
          starts_at?: string | null
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      invoices: {
        Row: {
          created_at: string
          currency_label: string
          customer_name: string
          delivery_fee: number
          discount: number
          id: string
          invoice_number: number
          issued_at: string
          order_id: string
          payment_method: string | null
          payment_status: string
          phone: string
          points_awarded: number
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_label?: string
          customer_name?: string
          delivery_fee?: number
          discount?: number
          id?: string
          invoice_number?: number
          issued_at?: string
          order_id: string
          payment_method?: string | null
          payment_status?: string
          phone?: string
          points_awarded?: number
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_label?: string
          customer_name?: string
          delivery_fee?: number
          discount?: number
          id?: string
          invoice_number?: number
          issued_at?: string
          order_id?: string
          payment_method?: string | null
          payment_status?: string
          phone?: string
          points_awarded?: number
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_accounts: {
        Row: {
          created_at: string
          customer_name: string | null
          id: string
          pending_points: number
          phone: string
          points: number
          total_spent: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          id?: string
          pending_points?: number
          phone: string
          points?: number
          total_spent?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          id?: string
          pending_points?: number
          phone?: string
          points?: number
          total_spent?: number
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_coupons: {
        Row: {
          account_id: string
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          points_spent: number
          reward_id: string | null
          status: string
          updated_at: string
          used_order_id: string | null
        }
        Insert: {
          account_id: string
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          points_spent?: number
          reward_id?: string | null
          status?: string
          updated_at?: string
          used_order_id?: string | null
        }
        Update: {
          account_id?: string
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          points_spent?: number
          reward_id?: string | null
          status?: string
          updated_at?: string
          used_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_coupons_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "loyalty_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_coupons_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_coupons_used_order_id_fkey"
            columns: ["used_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rewards: {
        Row: {
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          name: string
          points_required: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          name: string
          points_required?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          name?: string
          points_required?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_settings: {
        Row: {
          amount_per_point: number
          base_currency: string
          coupon_expiry_days: number
          created_at: string
          id: string
          is_active: boolean
          min_redeem_points: number
          point_value: number
          updated_at: string
        }
        Insert: {
          amount_per_point?: number
          base_currency?: string
          coupon_expiry_days?: number
          created_at?: string
          id?: string
          is_active?: boolean
          min_redeem_points?: number
          point_value?: number
          updated_at?: string
        }
        Update: {
          amount_per_point?: number
          base_currency?: string
          coupon_expiry_days?: number
          created_at?: string
          id?: string
          is_active?: boolean
          min_redeem_points?: number
          point_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          account_id: string
          created_at: string
          description: string | null
          id: string
          order_id: string | null
          order_number: number | null
          points: number
          type: string
        }
        Insert: {
          account_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          order_number?: number | null
          points?: number
          type?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          order_number?: number | null
          points?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "loyalty_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string | null
          product_name: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price?: number
          product_id?: string | null
          product_name: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          city: string
          created_at: string
          currency: string
          currency_label: string
          currency_rate: number
          customer_name: string
          delivery_fee: number
          district: string | null
          id: string
          last_contact_at: string | null
          notes: string | null
          order_number: number
          payment_method: string | null
          payment_status: string
          phone: string
          receipt_url: string | null
          status: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          currency?: string
          currency_label?: string
          currency_rate?: number
          customer_name: string
          delivery_fee?: number
          district?: string | null
          id?: string
          last_contact_at?: string | null
          notes?: string | null
          order_number?: number
          payment_method?: string | null
          payment_status?: string
          phone: string
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          currency?: string
          currency_label?: string
          currency_rate?: number
          customer_name?: string
          delivery_fee?: number
          district?: string | null
          id?: string
          last_contact_at?: string | null
          notes?: string | null
          order_number?: number
          payment_method?: string | null
          payment_status?: string
          phone?: string
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          account_details: string | null
          created_at: string
          icon: string | null
          id: string
          instructions: string | null
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          account_details?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          account_details?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_prices: {
        Row: {
          created_at: string
          currency_code: string
          discount_price: number | null
          id: string
          price: number | null
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency_code: string
          discount_price?: number | null
          id?: string
          price?: number | null
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency_code?: string
          discount_price?: number | null
          id?: string
          price?: number | null
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_prices_currency_code_fkey"
            columns: ["currency_code"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string
          customer_name: string
          id: string
          is_approved: boolean
          product_id: string
          rating: number
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          is_approved?: boolean
          product_id: string
          rating?: number
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          is_approved?: boolean
          product_id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          discount_price: number | null
          id: string
          images: string[]
          is_bestseller: boolean
          is_featured: boolean
          name: string
          price: number
          sku: string | null
          slug: string
          status: boolean
          stock: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          discount_price?: number | null
          id?: string
          images?: string[]
          is_bestseller?: boolean
          is_featured?: boolean
          name: string
          price?: number
          sku?: string | null
          slug: string
          status?: boolean
          stock?: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          discount_price?: number | null
          id?: string
          images?: string[]
          is_bestseller?: boolean
          is_featured?: boolean
          name?: string
          price?: number
          sku?: string | null
          slug?: string
          status?: boolean
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          addresses: Json
          avatar_url: string | null
          created_at: string
          district: string | null
          full_name: string | null
          governorate: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          addresses?: Json
          avatar_url?: string | null
          created_at?: string
          district?: string | null
          full_name?: string | null
          governorate?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          addresses?: Json
          avatar_url?: string | null
          created_at?: string
          district?: string | null
          full_name?: string | null
          governorate?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          about: string | null
          about_content: string | null
          address: string | null
          brand_text_color: string
          card_style: string
          contact_content: string | null
          currency: string
          currency_label: string
          delivery_default_fee: number
          delivery_enabled: boolean
          description: string | null
          email: string | null
          facebook: string | null
          free_delivery_until: string | null
          grid_columns: number
          hero_image: string | null
          hero_subtitle: string | null
          hero_title: string | null
          hide_lovable_badge: boolean
          id: string
          instagram: string | null
          logo: string | null
          og_image: string | null
          phone: string | null
          require_email_confirm: boolean
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          snapchat: string | null
          store_image: string | null
          store_name: string
          tiktok: string | null
          twitter: string | null
          updated_at: string
          whatsapp_number: string
          working_hours: string | null
          youtube: string | null
        }
        Insert: {
          about?: string | null
          about_content?: string | null
          address?: string | null
          brand_text_color?: string
          card_style?: string
          contact_content?: string | null
          currency?: string
          currency_label?: string
          delivery_default_fee?: number
          delivery_enabled?: boolean
          description?: string | null
          email?: string | null
          facebook?: string | null
          free_delivery_until?: string | null
          grid_columns?: number
          hero_image?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          hide_lovable_badge?: boolean
          id?: string
          instagram?: string | null
          logo?: string | null
          og_image?: string | null
          phone?: string | null
          require_email_confirm?: boolean
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          snapchat?: string | null
          store_image?: string | null
          store_name?: string
          tiktok?: string | null
          twitter?: string | null
          updated_at?: string
          whatsapp_number?: string
          working_hours?: string | null
          youtube?: string | null
        }
        Update: {
          about?: string | null
          about_content?: string | null
          address?: string | null
          brand_text_color?: string
          card_style?: string
          contact_content?: string | null
          currency?: string
          currency_label?: string
          delivery_default_fee?: number
          delivery_enabled?: boolean
          description?: string | null
          email?: string | null
          facebook?: string | null
          free_delivery_until?: string | null
          grid_columns?: number
          hero_image?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          hide_lovable_badge?: boolean
          id?: string
          instagram?: string | null
          logo?: string | null
          og_image?: string | null
          phone?: string | null
          require_email_confirm?: boolean
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          snapchat?: string | null
          store_image?: string | null
          store_name?: string
          tiktok?: string | null
          twitter?: string | null
          updated_at?: string
          whatsapp_number?: string
          working_hours?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          content: string
          created_at: string
          customer_name: string
          id: string
          is_visible: boolean
          rating: number
        }
        Insert: {
          content: string
          created_at?: string
          customer_name: string
          id?: string
          is_visible?: boolean
          rating?: number
        }
        Update: {
          content?: string
          created_at?: string
          customer_name?: string
          id?: string
          is_visible?: boolean
          rating?: number
        }
        Relationships: []
      }
      themes: {
        Row: {
          accent_color: string
          background_color: string
          card_color: string
          created_at: string
          foreground_color: string
          id: string
          is_default: boolean
          name: string
          nav_items: Json
          nav_position: string
          nav_style: string
          primary_color: string
          radius: string
          show_labels: boolean
          sort_order: number
          thumbnail: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string
          background_color?: string
          card_color?: string
          created_at?: string
          foreground_color?: string
          id?: string
          is_default?: boolean
          name: string
          nav_items?: Json
          nav_position?: string
          nav_style?: string
          primary_color?: string
          radius?: string
          show_labels?: boolean
          sort_order?: number
          thumbnail?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string
          background_color?: string
          card_color?: string
          created_at?: string
          foreground_color?: string
          id?: string
          is_default?: boolean
          name?: string
          nav_items?: Json
          nav_position?: string
          nav_style?: string
          primary_color?: string
          radius?: string
          show_labels?: boolean
          sort_order?: number
          thumbnail?: string | null
          updated_at?: string
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
      whatsapp_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          order_id: string | null
          phone: string
          template: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          order_id?: string | null
          phone: string
          template?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          order_id?: string | null
          phone?: string
          template?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_exists: { Args: never; Returns: boolean }
      claim_first_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      order_status:
        | "new"
        | "reviewing"
        | "confirmed"
        | "processing"
        | "shipped"
        | "completed"
        | "cancelled"
        | "ready"
        | "delivered"
        | "returned"
        | "no_contact"
        | "on_hold"
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
      app_role: ["admin", "user"],
      order_status: [
        "new",
        "reviewing",
        "confirmed",
        "processing",
        "shipped",
        "completed",
        "cancelled",
        "ready",
        "delivered",
        "returned",
        "no_contact",
        "on_hold",
      ],
    },
  },
} as const
