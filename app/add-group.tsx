import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  display_name: string;
}

export default function AddGroupPage() {
  const [type, setType] = useState<'collaborative' | 'competitive'>('collaborative');
  const [squadName, setSquadName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [weeklyGoal, setWeeklyGoal] = useState<number>(10);
  const [punishmentText, setPunishmentText] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name');
      if (error) {
        console.error('Failed to fetch users:', error.message);
      } else {
        setUsers(data ?? []);
      }
    };
    fetchUsers();
  }, []);

  const toggleFriend = (id: string) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const incrementGoal = () => setWeeklyGoal((prev) => Math.min(prev + 1, 30));
  const decrementGoal = () => setWeeklyGoal((prev) => Math.max(prev - 1, 1));

  const handleCreate = async () => {
    if (!squadName.trim()) {
      Alert.alert('Required', 'Please enter a squad name');
      return;
    }
    if (type === 'collaborative' && weeklyGoal < 1) {
      Alert.alert('Invalid Goal', 'Please set a weekly goal of at least 1');
      return;
    }
    if (type === 'competitive' && !punishmentText.trim()) {
      Alert.alert('Required', 'Please enter a punishment');
      return;
    }

    try {
      const { error } = await supabase.from('squads').insert({
        squad_name: squadName.trim(),
        squad_type: type,
        squad_members: selectedFriends,
        per_week: type === 'collaborative' ? weeklyGoal : null,
        punishment: type === 'competitive' ? punishmentText.trim() : null,
      });

      if (error) throw error;

      router.navigate('/(tabs)/leaderboard');
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#475569" />
          </TouchableOpacity>
          <Text style={styles.title}>New Squad</Text>
        </View>

        {/* Squad Name */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Squad Name</Text>
          <View style={styles.nameCard}>
            <View style={styles.nameIcon}>
              <Ionicons name="people" size={20} color="#94a3b8" />
            </View>
            <TextInput
              placeholder="e.g. Morning Crew"
              placeholderTextColor="#94a3b8"
              style={styles.nameInput}
              value={squadName}
              onChangeText={setSquadName}
            />
          </View>
        </View>

        {/* Vibe */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Vibe</Text>
          <View style={styles.vibeGrid}>
            <TouchableOpacity
              style={[
                styles.vibeCard,
                type === 'collaborative' ? styles.vibeCardCooperative : styles.vibeCardInactive,
              ]}
              onPress={() => setType('collaborative')}
            >
              <View
                style={[
                  styles.vibeIcon,
                  {
                    backgroundColor:
                      type === 'collaborative'
                        ? 'rgba(143,188,143,0.1)'
                        : '#f1f5f9',
                  },
                ]}
              >
                <Ionicons
                  name="radio-button-on"
                  size={20}
                  color={type === 'collaborative' ? '#8fbc8f' : '#94a3b8'}
                />
              </View>
              <Text style={[styles.vibeTitle, type !== 'collaborative' && styles.vibeTitleInactive]}>
                Cooperative
              </Text>
              <Text style={styles.vibeDesc}>Work together towards a shared goal.</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.vibeCard,
                type === 'competitive' ? styles.vibeCardCompetitive : styles.vibeCardInactive,
              ]}
              onPress={() => setType('competitive')}
            >
              <View
                style={[
                  styles.vibeIcon,
                  {
                    backgroundColor:
                      type === 'competitive'
                        ? 'rgba(232,165,152,0.1)'
                        : '#f1f5f9',
                  },
                ]}
              >
                <Ionicons
                  name="trophy"
                  size={20}
                  color={type === 'competitive' ? '#e8a598' : '#94a3b8'}
                />
              </View>
              <Text style={[styles.vibeTitle, type !== 'competitive' && styles.vibeTitleInactive]}>
                Competitive
              </Text>
              <Text style={styles.vibeDesc}>Loser faces the weekly punishment.</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ← UPDATED: Conditional Challenge/Punishment Input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {type === 'collaborative' ? 'Weekly Goal' : 'Weekly Punishment'}
          </Text>
          
          {type === 'collaborative' ? (
            // 🎯 Numeric Stepper for Cooperative
            <View style={styles.stepperCard}>
              <TouchableOpacity 
                style={styles.stepperButton} 
                onPress={decrementGoal}
                disabled={weeklyGoal <= 1}
              >
                <Ionicons 
                  name="remove" 
                  size={24} 
                  color={weeklyGoal <= 1 ? '#cbd5e1' : '#8fbc8f'} 
                />
              </TouchableOpacity>
              
              <View style={styles.stepperValue}>
                <Text style={styles.stepperNumber}>{weeklyGoal}</Text>
                <Text style={styles.stepperLabel}>sessions total/week</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.stepperButton} 
                onPress={incrementGoal}
                disabled={weeklyGoal >= 30}
              >
                <Ionicons 
                  name="add" 
                  size={24} 
                  color={weeklyGoal >= 30 ? '#cbd5e1' : '#8fbc8f'} 
                />
              </TouchableOpacity>
            </View>
          ) : (
            // 💀 Text Input for Competitive
            <View style={styles.challengeCard}>
              <View style={styles.challengeIcon}>
                <Ionicons name="skull" size={20} color="#e8a598" />
              </View>
              <TextInput
                placeholder="e.g. Buy the winner lunch"
                placeholderTextColor="#94a3b8"
                style={styles.challengeInput}
                value={punishmentText}
                onChangeText={setPunishmentText}
              />
            </View>
          )}
        </View>

        {/* Add Members */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Add Members</Text>
          <View style={styles.friendsList}>
            {users.map((user, idx) => {
              const isSelected = selectedFriends.includes(user.id);
              return (
                <TouchableOpacity
                  key={user.id}
                  style={[
                    styles.friendRow,
                    idx !== users.length - 1 && styles.friendRowBorder,
                    isSelected && styles.friendRowActive,
                  ]}
                  onPress={() => toggleFriend(user.id)}
                >
                  <View style={styles.friendLeft}>
                    <View style={styles.friendAvatar}>
                      <Text style={styles.friendEmoji}>🧑</Text>
                    </View>
                    <Text style={styles.friendName}>{user.display_name}</Text>
                  </View>
                  <View style={[styles.selectCircle, isSelected && styles.selectCircleActive]}>
                    {isSelected && <View style={styles.selectDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
          <Text style={styles.createButtonText}>Create Squad</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f5' },
  scroll: { flex: 1, paddingHorizontal: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 16,
    marginBottom: 32,
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
  section: { marginBottom: 32 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
    marginLeft: 4,
  },
  nameCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  nameIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#faf8f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  nameInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  vibeGrid: { flexDirection: 'row', gap: 12 },
  vibeCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  vibeCardCooperative: {
    borderColor: '#8fbc8f',
    backgroundColor: '#ffffff',
  },
  vibeCardCompetitive: {
    borderColor: '#e8a598',
    backgroundColor: '#ffffff',
  },
  vibeCardInactive: {
    borderColor: '#e2e8f0',
    backgroundColor: 'transparent',
    opacity: 0.6,
  },
  vibeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  vibeTitle: { fontSize: 13, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  vibeTitleInactive: { color: '#64748b' },
  vibeDesc: { fontSize: 10, color: '#94a3b8', fontWeight: '500', lineHeight: 14 },
  
  // ← UPDATED: Stepper Styles for Cooperative
  stepperCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#faf8f5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stepperValue: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  stepperNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#8fbc8f',
  },
  stepperLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 2,
  },
  
  // Text Input for Competitive
  challengeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  challengeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#faf8f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  challengeInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  
  friendsList: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  friendRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  friendRowActive: { backgroundColor: '#faf8f5' },
  friendLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  friendEmoji: { fontSize: 20 },
  friendName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  selectCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectCircleActive: { backgroundColor: '#8fbc8f', borderColor: '#8fbc8f' },
  selectDot: { width: 10, height: 10, backgroundColor: '#ffffff', borderRadius: 5 },
  createButton: {
    backgroundColor: '#8fbc8f',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: { fontSize: 17, fontWeight: '700', color: '#ffffff' },
});