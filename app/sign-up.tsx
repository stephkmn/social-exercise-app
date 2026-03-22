import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase'; // Corrected import path
import { useRouter, Stack } from 'expo-router'; // Added useRouter and Stack

const SignUpForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // Initialize useRouter

  const handleSignUp = async () => { // Removed event parameter as it's not needed for RN Button
    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match!'); // Changed to React Native Alert
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
      Alert.alert(`Error: ${error.message}`); // Changed to React Native Alert
    } else if (data.user) {
      Alert.alert('Sign-up successful! Please check your email to verify your account.');
      // Navigate to auth page after successful sign-up
      router.push('/auth');
      // Clear form (optional, as we are navigating away)
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setDisplayName('');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text style={styles.title}>Create a new account</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Display Name</Text>
        <TextInput
          style={styles.input}
          onChangeText={setDisplayName}
          value={displayName}
          placeholder="Enter your display name"
          autoCapitalize="none"
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          onChangeText={setEmail}
          value={email}
          placeholder="email@address.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          onChangeText={setPassword}
          value={password}
          secureTextEntry
          placeholder="Enter your password"
          autoCapitalize="none"
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          onChangeText={setConfirmPassword}
          value={confirmPassword}
          secureTextEntry
          placeholder="Confirm your password"
          autoCapitalize="none"
        />
      </View>
      <Button
        title={loading ? 'Loading...' : 'Create Account'}
        onPress={handleSignUp}
        disabled={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
  },
});

export default SignUpForm;
