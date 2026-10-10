import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import { hashPasswordWithSalt, verifyPassword, generateSalt } from './cryptoAuth';

// Default Supabase Project URL provided for F.R.I.D.A.Y.
export const SUPABASE_PROJECT_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://qgzswuytdfekjdqfxgsb.supabase.co';

// Helper to get active Supabase Anon Key (from env or session storage)
export function getSupabaseAnonKey(): string {
  return (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    sessionStorage.getItem('friday_supabase_anon_key') ||
    localStorage.getItem('friday_supabase_anon_key') ||
    ''
  );
}

export function setSupabaseAnonKey(key: string, persistToLocal = true) {
  if (persistToLocal) {
    localStorage.setItem('friday_supabase_anon_key', key.trim());
  } else {
    sessionStorage.setItem('friday_supabase_anon_key', key.trim());
  }
}

// ─── Database Types ────────────────────────────────────────────────
export type StationId = 'BASE_A' | 'BASE_C';
export type MessageCategory = 'NORMAL' | 'SOS' | 'MEDICAL' | 'ALL_CLEAR' | 'DISASTER';
export type DeliveryStatus = 'CLOUD_DELIVERED' | 'HARDWARE_PENDING';
export type AckStatus = 'UNACKNOWLEDGED' | 'ACKNOWLEDGED';

export interface CloudMessage {
  id: string;
  conversation_id: string;
  sender_station: StationId;
  recipient_station: StationId;
  message_text: string;
  category: MessageCategory;
  disaster_type?: string | null;
  direction?: string | null;
  delivery_status: DeliveryStatus;
  ack_status: AckStatus;
  ack_at?: string | null;
  created_at: string;
}

export interface StationCredentialsRow {
  station_id: StationId;
  station_name: string;
  password_hash: string;
  salt: string;
  updated_at: string;
}

export interface SystemSetupRow {
  id: string;
  is_setup_completed: boolean;
  setup_at: string | null;
  version: string;
}

// ─── Client Singleton ──────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabaseClientInstance: any = null;
let cachedKey = '';

export function getSupabaseClient(): any {
  const currentKey = getSupabaseAnonKey();
  if (!supabaseClientInstance || cachedKey !== currentKey) {
    cachedKey = currentKey;
    supabaseClientInstance = createClient<any>(
      SUPABASE_PROJECT_URL,
      currentKey || 'dummy_anon_key_until_configured',
      {
        auth: { persistSession: false },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      }
    );
  }
  return supabaseClientInstance;
}

export function isSupabaseConfigured(): boolean {
  const key = getSupabaseAnonKey();
  return Boolean(key && key.length > 20 && key !== 'your_supabase_anon_public_key_here');
}

// ─── Database Operations ───────────────────────────────────────────

/**
 * Check whether system setup is completed in the database.
 */
export async function checkDatabaseSetup(): Promise<{
  isConfigured: boolean;
  isSetupCompleted: boolean;
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { isConfigured: false, isSetupCompleted: false };
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('system_setup')
      .select('is_setup_completed')
      .eq('id', 'SYSTEM_CONFIG')
      .maybeSingle();

    if (error) {
      return { isConfigured: true, isSetupCompleted: false, error: error.message };
    }

    return {
      isConfigured: true,
      isSetupCompleted: Boolean(data?.is_setup_completed),
    };
  } catch (err: unknown) {
    return {
      isConfigured: true,
      isSetupCompleted: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Complete initial system setup: store salted password hashes for Base A and Base C.
 */
export async function completeSystemSetupInDB(
  stationAPassword: string,
  stationCPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    // Generate separate cryptographic salts
    const saltA = generateSalt();
    const saltC = generateSalt();

    const hashA = await hashPasswordWithSalt(stationAPassword, saltA);
    const hashC = await hashPasswordWithSalt(stationCPassword, saltC);

    // Upsert Station A
    const { error: errA } = await supabase.from('station_credentials').upsert({
      station_id: 'BASE_A',
      station_name: 'Base Station Alpha',
      password_hash: hashA,
      salt: saltA,
      updated_at: new Date().toISOString(),
    });
    if (errA) throw new Error(`Station A setup failed: ${errA.message}`);

    // Upsert Station C
    const { error: errC } = await supabase.from('station_credentials').upsert({
      station_id: 'BASE_C',
      station_name: 'Base Station Charlie',
      password_hash: hashC,
      salt: saltC,
      updated_at: new Date().toISOString(),
    });
    if (errC) throw new Error(`Station C setup failed: ${errC.message}`);

    // Mark setup as completed
    const { error: errSetup } = await supabase.from('system_setup').upsert({
      id: 'SYSTEM_CONFIG',
      is_setup_completed: true,
      setup_at: new Date().toISOString(),
      version: '2.4-LTS',
    });
    if (errSetup) throw new Error(`System setup flag failed: ${errSetup.message}`);

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Verify station login credentials against salted hash stored in Supabase.
 */
export async function verifyStationLoginDB(
  stationId: StationId,
  passwordAttempt: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('station_credentials')
      .select('password_hash, salt')
      .eq('station_id', stationId)
      .maybeSingle();

    if (error || !data) {
      return { success: false, error: 'Station credentials record not found.' };
    }

    const isValid = await verifyPassword(passwordAttempt, data.salt, data.password_hash);
    if (!isValid) {
      return { success: false, error: 'Invalid password for this station.' };
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Fetch all shared messages, newest first.
 */
export async function fetchMessagesFromDB(): Promise<{
  messages: CloudMessage[];
  error?: string;
}> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    return { messages: (data as CloudMessage[]) || [] };
  } catch (err: unknown) {
    return {
      messages: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Post a new message to the shared database.
 */
export async function postMessageToDB(payload: {
  sender_station: StationId;
  recipient_station: StationId;
  message_text: string;
  category: MessageCategory;
  disaster_type?: string | null;
  direction?: string | null;
}): Promise<{ message?: CloudMessage; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: 'MISSION-ALPHA-CHARLIE-01',
        sender_station: payload.sender_station,
        recipient_station: payload.recipient_station,
        message_text: payload.message_text.trim(),
        category: payload.category,
        disaster_type: payload.disaster_type || null,
        direction: payload.direction || null,
        delivery_status: 'CLOUD_DELIVERED',
        ack_status: 'UNACKNOWLEDGED',
      })
      .select()
      .single();

    if (error) throw error;
    return { message: data as CloudMessage };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Acknowledge an existing message.
 */
export async function acknowledgeMessageInDB(messageId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('messages')
      .update({
        ack_status: 'ACKNOWLEDGED',
        ack_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (error) throw error;
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Subscribe to realtime changes on the public.messages table.
 */
export function subscribeToCloudMessages(
  onInsert: (message: CloudMessage) => void,
  onUpdate: (message: CloudMessage) => void
): RealtimeChannel | null {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = getSupabaseClient();
    // Unique channel topic to avoid collision with previously subscribed channel during hot-reload
    const channelId = `realtime-messages-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload: any) => {
          onInsert(payload.new as CloudMessage);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload: any) => {
          onUpdate(payload.new as CloudMessage);
        }
      )
      .subscribe();

    return channel;
  } catch (err) {
    console.error('Failed to attach Supabase Realtime channel:', err);
    return null;
  }
}
