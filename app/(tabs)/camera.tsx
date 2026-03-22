import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function CameraPage() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.title}>Log Session</Text>
          <TouchableOpacity style={styles.flipButton}>
            <Ionicons name="refresh" size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Camera Viewfinder */}
        <View style={styles.viewfinder}>
          {/* Grid overlay */}
          <View style={StyleSheet.absoluteFill as object}>
            <View style={[styles.gridRow]}>
              <View style={[styles.gridCell, styles.borderRight, styles.borderBottom]} />
              <View style={[styles.gridCell, styles.borderRight, styles.borderBottom]} />
              <View style={[styles.gridCell, styles.borderBottom]} />
            </View>
            <View style={[styles.gridRow]}>
              <View style={[styles.gridCell, styles.borderRight, styles.borderBottom]} />
              <View style={[styles.gridCell, styles.borderRight, styles.borderBottom]} />
              <View style={[styles.gridCell, styles.borderBottom]} />
            </View>
            <View style={[styles.gridRow]}>
              <View style={[styles.gridCell, styles.borderRight]} />
              <View style={[styles.gridCell, styles.borderRight]} />
              <View style={styles.gridCell} />
            </View>
          </View>

          <Ionicons name="camera" size={48} color="rgba(255,255,255,0.3)" />
          <Text style={styles.hint}>Show up. Snap. Done.</Text>
        </View>

        {/* Snap Button */}
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={() => router.push('/ai-labels')}
            style={styles.snapButtonOuter}
          >
            <View style={styles.snapButtonInner} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8f5',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
    opacity: 0.2,
  },
  gridCell: {
    flex: 1,
  },
  borderRight: {
    borderRightWidth: 1,
    borderRightColor: '#ffffff',
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#ffffff',
  },
  hint: {
    position: 'absolute',
    bottom: 24,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  controls: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
});
