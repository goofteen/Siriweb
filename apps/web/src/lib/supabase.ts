import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('กรุณาตั้งค่า VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY ใน .env')
}

// Default client — ใช้สำหรับ public catalog reads ที่ไม่ต้องการ session header
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

/**
 * สร้าง Supabase client ที่แนบ x-session-id header ทุก request
 * จำเป็นสำหรับ RLS policies บน wishlist_items / user_vehicles
 * ที่ใช้ current_setting('request.headers')::json->>'x-session-id'
 */
export function createSessionClient(sessionId: string) {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { 'x-session-id': sessionId },
    },
  })
}
