import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

interface Squad {
  squad_id: string;
  squad_name: string;
  squad_type: 'competitive' | 'cooperative';
  squad_members: { id: string }[];
}

export default function JoinSquadPage() {
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSquads = async () => {
      const { data, error } = await supabase
        .from('squads')
        .select('squad_id, squad_name, squad_type, squad_members');

      if (error) {
        console.error('Failed to fetch squads:', error.message);
      } else {
        setSquads(data ?? []);
      }
      setLoading(false);
    };

    fetchSquads();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#475569" />
        </TouchableOpacity>
        <Text style={styles.title}>Join a Squad</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#8fbc8f" />
        </View>
      ) : squads.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="people-outline" size={56} color="#cbd5e1" />
          <Text style={styles.emptyHeading}>No squads available</Text>
          <Text style={styles.emptySubtitle}>Be the first to create one.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {squads.map((squad) => (
            <TouchableOpacity key={squad.squad_id} style={styles.squadCard}>
              <View style={styles.squadEmoji}>
                <Text style={styles.squadEmojiText}>
                  {squad.squad_type === 'competitive' ? '🏆' : '🤝'}
                </Text>
              </View>
              <View style={styles.squadInfo}>
                <Text style={styles.squadName}>{squad.squad_name}</Text>
                <Text style={styles.squadMeta}>
                  {squad.squad_type === 'competitive' ? 'Competitive' : 'Cooperative'} ·{' '}
                  {squad.squad_members?.length ?? 0} members
                </Text>
              </View>
              <TouchableOpacity style={styles.joinButton}>
                <Text style={styles.joinButtonText}>Join</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 24,
  },
  backButton: {
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
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
  scroll: { flex: 1, paddingHorizontal: 24 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyHeading: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  emptySubtitle: { fontSize: 14, color: '#64748b' },
  squadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  squadEmoji: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#faf8f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  squadEmojiText: { fontSize: 22 },
  squadInfo: { flex: 1 },
  squadName: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  squadMeta: { fontSize: 12, color: '#94a3b8' },
  joinButton: {
    backgroundColor: '#8fbc8f',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  joinButtonText: { fontSize: 13, fontWeight: '700', color: '#ffffff' },
});
