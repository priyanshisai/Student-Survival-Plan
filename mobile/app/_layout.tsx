import "@/lib/supabase/bootstrap";
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initSupabase, getSupabase } from '@/lib/supabase/client';
import { supabase } from '@/lib/supabase/client';
import { Slot } from "expo-router";
import { router } from 'expo-router';
import { StatusBar } from "expo-status-bar";

initSupabase(AsyncStorage);

export default function RootLayout() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const supabase = getSupabase();

        // Check for existing session before redirecting
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) router.replace('/login');
            setReady(true);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (!session) router.replace('/login');
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    if (!ready) return null;

  return (
    <>
      <StatusBar style="light" />
      <Slot />
    </>
  );
}
