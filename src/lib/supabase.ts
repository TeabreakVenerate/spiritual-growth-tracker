import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export interface SpiritualLog {
  id?: string;
  user_id: string;
  date: string;
  bible_chapters: string;
  prayer_minutes: number;
  prayer_focus?: string;
  journal_entry?: string;
  lesson_learned?: string;
  created_at?: string;
}
