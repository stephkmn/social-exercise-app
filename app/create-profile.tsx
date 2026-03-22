import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer'; // For image upload

export default function CreateProfileScreen() {
  const { email, password } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to make this work!');
      }
    })();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setAvatarUrl(result.assets[0].uri);
      setAvatarFile(result.assets[0]);
    }
  };

  const uploadAvatar = async (userId: string) => {
    if (!avatarFile) return null;

    const fileExt = avatarFile.mimeType?.split('/')[1] || 'png'; // Get extension from mimeType, default to png
    const fileName = `${userId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`; // Generate unique filename
    const filePath = `${userId}/${fileName}`;

    try {
      const response = await fetch(avatarFile.uri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from('avatars') // Assuming you have a storage bucket named 'avatars'
        .upload(filePath, blob, { // Uploading blob directly
          contentType: avatarFile.mimeType || 'image/jpeg',
          upsert: true,
        });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      return publicUrlData.publicUrl;
    } catch (error: any) {
      Alert.alert('Upload Error', error.message);
      return null;
    }
  };

  const handleCreateProfile = async () => {
    if (!username || !displayName) {
      Alert.alert('Error', 'Username and Display Name are required.');
      return;
    }

    setLoading(true);

    try {
      // 1. Sign up the user with email and password
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email as string,
        password: password as string,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('User not returned after sign up.');
      }

      const userId = authData.user.id;
      let publicAvatarUrl: string | null = null;

      // 2. Upload avatar if selected
      if (avatarFile) {
        publicAvatarUrl = await uploadAvatar(userId);
      }

      // 3. Insert profile data into public.profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username,
          display_name: displayName,
          avatar_url: publicAvatarUrl,
          email: email as string, // Store email in profile for easier access
        });

      if (profileError) {
        throw profileError;
      }

      Alert.alert('Success', 'Account created and profile saved!');
      router.replace('/'); // Navigate to feed or home page
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>Tell us a bit about yourself.</Text>
        </View>

        <View style={styles.form}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarPlaceholder}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="camera" size={48} color={Colors.textFaint} />
            )}
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to choose avatar</Text>

          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor={Colors.textFaint}
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Display Name"
            placeholderTextColor={Colors.textFaint}
            autoCapitalize="words"
            value={displayName}
            onChangeText={setDisplayName}
          />

          <TouchableOpacity style={styles.button} onPress={handleCreateProfile} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.buttonText}>Create Profile</Text>
            )}
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
      marginBottom: 32,
    },
    title: {
      fontSize: 28,
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
      alignItems: 'center',
    },
    avatarPlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: Colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarHint: {
      fontSize: 12,
      color: Colors.textFaint,
      marginBottom: 24,
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
      width: '100%',
    },
    button: {
      backgroundColor: Colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 8,
      width: '100%',
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '700',
      color: Colors.white,
    },
  });
