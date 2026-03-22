import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const LABELS = ['Yoga Mat', 'Indoor', 'Morning Light', 'Stretching'];

export default function AILabelsPage() {
  const [showButton, setShowButton] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const labelAnims = useRef(LABELS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Stagger label animations
    const labelAnimations = LABELS.map((_, idx) =>
      Animated.timing(labelAnims[idx], {
        toValue: 1,
        duration: 300,
        delay: 500 + idx * 300,
        useNativeDriver: true,
      })
    );
    Animated.stagger(300, labelAnimations).start();

    const timer = setTimeout(() => {
      setShowButton(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Ionicons name="sparkles" size={24} color="#8fbc8f" />
          <Text style={styles.title}>AI Validating...</Text>
        </View>

        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600&h=600',
            }}
            style={styles.image}
          />
          <View style={[StyleSheet.absoluteFill, styles.overlay]} />
          <View style={styles.labelsContainer}>
            {LABELS.map((label, idx) => (
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
            <Text style={styles.successSubtitle}>
              We spotted some solid effort there.
            </Text>
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity
              onPress={() => router.push('/session-form')}
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
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 24,
  },
  image: { width: '100%', height: '100%' },
  overlay: { backgroundColor: 'rgba(0,0,0,0.2)' },
  labelsContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
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
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
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
});
