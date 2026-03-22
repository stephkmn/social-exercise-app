import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SquadUpPage() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.inner}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#475569" />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>Pick one.</Text>
          <Text style={styles.subtitle}>Start fresh or hop into an existing squad.</Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/add-group')}
            >
              <View style={styles.buttonIcon}>
                <Ionicons name="add-circle-outline" size={28} color="#8fbc8f" />
              </View>
              <View style={styles.buttonText}>
                <Text style={styles.buttonTitle}>Create a Squad</Text>
                <Text style={styles.buttonDesc}>Set the rules, invite your crew.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/join-squad')}
            >
              <View style={styles.buttonIcon}>
                <Ionicons name="enter-outline" size={28} color="#e8a598" />
              </View>
              <View style={styles.buttonText}>
                <Text style={styles.buttonTitle}>Join a Squad</Text>
                <Text style={styles.buttonDesc}>Find a squad and jump in.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f5' },
  inner: { flex: 1, paddingHorizontal: 24 },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  content: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 36, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#64748b', marginBottom: 40 },
  buttons: { gap: 12 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  buttonIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#faf8f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { flex: 1 },
  buttonTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  buttonDesc: { fontSize: 13, color: '#94a3b8' },
});
