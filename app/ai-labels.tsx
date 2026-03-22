import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AILabelsPage() {
  const { labels: labelsParam, imageUrl, timestamp } = useLocalSearchParams<{ labels: string; imageUrl: string; timestamp: string }>();
  const labels: string[] = labelsParam ? JSON.parse(labelsParam) : [];
  const hasLabels = labels.length > 0;

  const [showButton, setShowButton] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const labelAnims = useRef(labels.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!hasLabels) return;

    const labelAnimations = labels.map((_, idx) =>
      Animated.timing(labelAnims[idx], {
        toValue: 1,
        duration: 300,
        delay: 400 + idx * 200,
        useNativeDriver: true,
      })
    );
    Animated.stagger(200, labelAnimations).start();

    const timer = setTimeout(() => {
      setShowButton(true);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 400 + labels.length * 200 + 400);

    return () => clearTimeout(timer);
  }, []);

  // No equipment detected
  if (!hasLabels) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.emptyInner}>
          <Ionicons name="search-outline" size={56} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No equipment detected</Text>
          <Text style={styles.emptySubtitle}>
            Make sure your workout equipment is visible in the photo and try again.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="camera-outline" size={18} color="#475569" />
            <Text style={styles.backButtonText}>Retake Photo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Ionicons name="sparkles" size={24} color="#8fbc8f" />
          <Text style={styles.title}>AI Validating...</Text>
        </View>

        {imageUrl ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUrl }} style={styles.image} />
            <View style={[StyleSheet.absoluteFill, styles.overlay]} />
          </View>
        ) : null}

        <View style={styles.detectedSection}>
          <Text style={styles.detectedSubtitle}>Detected:</Text>
          <View style={styles.labelsContainer}>
            {labels.map((label, idx) => (
              <Animated.View
                key={idx}
                style={[
                  styles.label,
                  {
                    opacity: labelAnims[idx],
                    transform: [
                      {
                        scale: labelAnims[idx].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Ionicons name="sparkles" size={12} color="#ffffff" />
                <Text style={styles.labelText}>{label}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Animated.View style={[styles.successBox, { opacity: fadeAnim }]}>
            <Text style={styles.successTitle}>Looks great! 🎉</Text>
            <Text style={styles.successSubtitle}>We spotted some solid effort there.</Text>
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity
              onPress={() => router.push({
                pathname: '/session-overview',
                params: { labels: labelsParam, imageUrl, timestamp },
              })}
              disabled={!showButton}
              style={styles.continueButton}
            >
              <Text style={styles.continueText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f5' },
  inner: { flex: 1, paddingHorizontal: 24, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
    marginBottom: 24,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
  imageContainer: {
    aspectRatio: 1,
    width: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 24,
  },
  image: { width: '100%', height: '100%' },
  overlay: { backgroundColor: 'rgba(0,0,0,0.15)' },
  detectedSection: { marginBottom: 24 },
  detectedSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  labelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#8fbc8f',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  labelText: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
  footer: { flex: 1, justifyContent: 'flex-end' },
  successBox: { alignItems: 'center', marginBottom: 24 },
  successTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  successSubtitle: { fontSize: 14, color: '#64748b' },
  continueButton: {
    backgroundColor: '#8fbc8f',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueText: { fontSize: 17, fontWeight: '700', color: '#ffffff' },
  emptyInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  emptySubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22 },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  backButtonText: { fontSize: 15, fontWeight: '600', color: '#475569' },
});
