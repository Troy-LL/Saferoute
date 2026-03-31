import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[SafeRoute] Supabase env vars not set. ' +
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
  )
}

/**
 * Supabase client — exposes crime_incidents and safe_spots tables
 * with public read access (RLS enforced on Supabase side).
 *
 * Service-role operations (insert, update, delete) are handled
 * exclusively by the FastAPI backend using SUPABASE_SERVICE_ROLE_KEY.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase
