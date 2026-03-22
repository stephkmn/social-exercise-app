import { useEffect, useState } from 'react';
import { SplashScreen, Stack, useRouter } from 'expo-router'; // Added useRouter
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const router = useRouter(); // Initialize useRouter

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialLoad(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setInitialLoad(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialLoad) {
      if (session) {
        router.replace('/(tabs)'); // Redirect to main app if authenticated
      } else {
        router.replace('/auth'); // Redirect to auth if not authenticated
      }
      SplashScreen.hideAsync();
    }
  }, [session, initialLoad]);

  if (initialLoad) {
    return null; // Or a custom loading component
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="ai-labels" />
        <Stack.Screen name="session-overview" />
        <Stack.Screen name="add-group" />
        <Stack.Screen name="squad-up" />
        <Stack.Screen name="join-squad" />
        <Stack.Screen name="create-profile" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="sign-up" />
      </Stack>
    </>
  );
}
