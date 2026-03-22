import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router'; // Added useRouter import

type AuthMode = 'signin' | 'signup';

export default function AuthScreen() {
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState(''); // Added displayName state
  const [loading, setLoading] = useState(false);

  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const router = useRouter(); // Initialized useRouter

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    // Add client-side password length validation
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      Alert.alert('Sign Up Error', error.message);
    } else {
      Alert.alert('Success', 'Please check your email to confirm your account.');
      // Clear form fields after successful sign-up
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setDisplayName('');
    }
    setLoading(false);
  };

  const handleSignIn = async () => {
    setLoading(true);
    // Navigate to the feed page
    router.replace('/'); // Changed to navigate to /
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>
            {authMode === 'signin' ? 'Sign in to continue' : 'Create an account to get started'}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, authMode === 'signin' && styles.toggleButtonActive]}
              onPress={() => setAuthMode('signin')}
            >
              <Text style={[styles.toggleButtonText, authMode === 'signin' && styles.toggleButtonTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, authMode === 'signup' && styles.toggleButtonActive]}
              onPress={() => setAuthMode('signup')}
            >
              <Text style={[styles.toggleButtonText, authMode === 'signup' && styles.toggleButtonTextActive]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.textFaint}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          {authMode === 'signup' && ( // Display Name input moved here
            <TextInput
              style={styles.input}
              placeholder="Display Name"
              placeholderTextColor={Colors.textFaint}
              autoCapitalize="words"
              value={displayName}
              onChangeText={setDisplayName}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.textFaint}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {authMode === 'signup' && ( // Confirm Password input remains here
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={Colors.textFaint}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={authMode === 'signin' ? handleSignIn : handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>
          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="logo-google" size={20} color={Colors.text} />
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colorScheme: 'light' | 'dark' | null | undefined) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      padding: 24,
    },
    header: {
      alignItems: 'center',
      marginBottom: 48,
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
      color: Colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: Colors.textMuted,
    },
    form: {
      marginBottom: 32,
    },
    toggleContainer: {
      flexDirection: 'row',
      backgroundColor: Colors.border,
      borderRadius: 20,
      padding: 4,
      marginBottom: 24,
    },
    toggleButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 16,
      alignItems: 'center',
    },
    toggleButtonActive: {
      backgroundColor: Colors.white,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    toggleButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.textMuted,
    },
    toggleButtonTextActive: {
      color: Colors.text,
    },
    input: {
      backgroundColor: Colors.white,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: Colors.text,
      marginBottom: 16,
    },
    button: {
      backgroundColor: Colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '700',
      color: Colors.white,
    },
    footer: {
      alignItems: 'center',
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      marginBottom: 24,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: Colors.border,
    },
    dividerText: {
      marginHorizontal: 16,
      fontSize: 12,
      fontWeight: '500',
      color: Colors.textFaint,
    },
    socialButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.white,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 12,
      paddingHorizontal: 24,
      paddingVertical: 14,
      width: '100%',
      justifyContent: 'center',
    },
    socialButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.text,
      marginLeft: 12,
    },
  });
