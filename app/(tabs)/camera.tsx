import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const devHost = Constants.expoConfig?.hostUri?.split(':').shift();
const API_BASE_URL = devHost ? `http://${devHost}:8000` : 'http://localhost:8000';

export default function CameraPage() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const takePicture = async () => {
    if (cameraRef.current) {
      const photoData = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      if (photoData) setPhoto(photoData.uri);
    }
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const handleUsePhoto = async () => {
    if (!photo) return;
    setUploading(true);
    console.log('[upload] API_BASE_URL:', API_BASE_URL);
    console.log('[upload] photo URI:', photo);
    try {
      let status: number;
      let result: any;

      if (Platform.OS === 'web') {
        const blob = await fetch(photo).then((r) => r.blob());
        const file = new File([blob], 'workout.jpg', { type: 'image/jpeg' });
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', 'default');
        console.log('[upload] sending web fetch...');
        const res = await fetch(`${API_BASE_URL}/detect`, { method: 'POST', body: formData });
        status = res.status;
        result = await res.json();
      } else {
        const formData = new FormData();
        formData.append('file', { uri: photo, name: 'workout.jpg', type: 'image/jpeg' } as any);
        formData.append('user_id', 'default');
        console.log('[upload] sending native fetch...');
        const res = await fetch(`${API_BASE_URL}/detect`, { method: 'POST', body: formData });
        console.log('[upload] response status:', res.status);
        status = res.status;
        result = await res.json();
      }

      if (status >= 400) throw new Error(result.error ?? `Server error: ${status}`);
      if (!result.success) throw new Error(result.error ?? 'Detection failed');

      const labels: string[] = (result.data?.detections ?? [])
        .filter((d: any) => d.category !== 'person')
        .map((d: any) => d.class);

      router.push({
        pathname: '/ai-labels',
        params: {
          labels: JSON.stringify(labels),
          imageUrl: result.data?.image_url ?? '',
          timestamp: result.timestamp ?? new Date().toISOString(),
        },
      });
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message ?? 'Could not reach the server. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Permission loading
  if (!permission) {
    return <View style={styles.container} />;
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.permissionInner}>
          <Ionicons name="camera-outline" size={64} color="#94a3b8" />
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionSubtitle}>
            We need your camera to snap your workout.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Access</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Photo preview
  if (photo) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <Text style={styles.title}>Log Session</Text>
          </View>

          <View style={styles.viewfinder}>
            <Image source={{ uri: photo }} style={StyleSheet.absoluteFillObject} />
          </View>

          <View style={styles.previewControls}>
            <TouchableOpacity style={styles.retakeButton} onPress={() => setPhoto(null)}>
              <Ionicons name="refresh" size={20} color="#475569" />
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.useButton, uploading && styles.useButtonDisabled]}
              onPress={handleUsePhoto}
              disabled={uploading}
            >
              <Text style={styles.useText}>{uploading ? 'Uploading...' : 'Use Photo'}</Text>
              {!uploading && <Ionicons name="arrow-forward" size={20} color="#ffffff" />}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Viewfinder
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.title}>Log Session</Text>
          <TouchableOpacity style={styles.flipButton} onPress={toggleFacing}>
            <Ionicons name="camera-reverse-outline" size={22} color="#475569" />
          </TouchableOpacity>
        </View>

        <View style={styles.viewfinder}>
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing}/>
        </View>

        <Text style={styles.hint}>Show up. Snap. Done.</Text>

        <View style={styles.controls}>
          <TouchableOpacity onPress={takePicture} style={styles.snapButtonOuter}>
            <View style={styles.snapButtonInner} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f5' },
  inner: { flex: 1, paddingHorizontal: 24, paddingBottom: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginBottom: 24,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
  flipButton: {
    width: 40,
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  viewfinder: {
    aspectRatio: 1,
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 32,
  },
  gridRow: { flex: 1, flexDirection: 'row', opacity: 0.2 },
  gridCell: { flex: 1 },
  borderRight: { borderRightWidth: 1, borderRightColor: '#ffffff' },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#ffffff' },
  hint: {
    alignSelf: 'center',
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  controls: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  snapButtonOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#8fbc8f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapButtonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8fbc8f',
  },
  previewControls: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  retakeText: { fontSize: 15, fontWeight: '600', color: '#475569' },
  useButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#8fbc8f',
    borderRadius: 16,
  },
  useText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  useButtonDisabled: { opacity: 0.6 },
  permissionInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  permissionTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  permissionSubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  permissionButton: {
    backgroundColor: '#8fbc8f',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
  },
  permissionButtonText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
});
