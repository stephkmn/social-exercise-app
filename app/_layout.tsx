import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="ai-labels" />
        <Stack.Screen name="session-overview" />
        <Stack.Screen name="add-group" />
        <Stack.Screen name="squad-up" />
        <Stack.Screen name="join-squad" />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
