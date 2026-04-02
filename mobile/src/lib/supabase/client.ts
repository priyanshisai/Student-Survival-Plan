import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import AsyncStorage from '@react-native-async-storage/async-storage';

type StorageAdapter = {
  getItem: (key: string) => string | Promise<string | null> | null;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,          // ← persists session to device
    autoRefreshToken: true,         // ← refreshes token automatically
    persistSession: true,           // ← keeps session after app closes
    detectSessionInUrl: false,      // ← required for React Native
  },
});

let supabaseClient: SupabaseClient | null = null;
const memoryStorage = new Map<string, string>();

const fallbackStorage: StorageAdapter = {
  getItem(key) {
    return memoryStorage.get(key) ?? null;
  },
  setItem(key, value) {
    memoryStorage.set(key, value);
  },
  removeItem(key) {
    memoryStorage.delete(key);
  },
};

export function initSupabase(storage: StorageAdapter = fallbackStorage) {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing Expo Supabase environment variables");
  }

  supabaseClient = createClient(url, anonKey, {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  return supabaseClient;
}

export function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = initSupabase();
  }

  return supabaseClient;
}
