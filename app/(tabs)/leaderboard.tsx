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
import { PersonPopup, type Profile } from '../../components/PersonPopup';
import { supabase } from '../../lib/supabase';

interface SquadMember {
  id: string;
  name: string;
  avatar: string;
  sessions: number;
  streak: number;
}

interface Squad {
  squad_id: string;
  squad_name: string;
  squad_type: 'competitive' | 'collaborative';
  squad_members: string[];
  per_week: number | null;
  punishment: string | null;
}

export default function LeaderboardPage() {
  const [squads, setSquads] = useState<Squad[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [activeSquadId, setActiveSquadId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchSquads = async () => {
      const { data, error } = await supabase
        .from('squads')
        .select('squad_id, squad_name, squad_type, squad_members, per_week, punishment');

      if (error) {
        console.error('Failed to fetch squads:', error.message);
        setLoading(false);
        return;
      }

      const fetched: Squad[] = data ?? [];
      setSquads(fetched);

      if (fetched.length > 0) {
        setActiveSquadId(fetched[0].squad_id);

        const allMemberIds = [...new Set(fetched.flatMap((s) => s.squad_members))];
        if (allMemberIds.length > 0) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, display_name, sessions, streaks')
            .in('id', allMemberIds);

          if (profileError) {
            console.error('Failed to fetch profiles:', profileError.message);
          } else {
            const profileMap: Record<string, Profile> = {};
            (profileData ?? []).forEach((p) => {
              profileMap[p.id] = p;
            });
            setProfiles(profileMap);
          }
        }
      }

      setLoading(false);
    };

    fetchSquads();
  }, []);

  const activeSquad = squads.find((s) => s.squad_id === activeSquadId) ?? null;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator color="#8fbc8f" />
        </View>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <Text style={styles.dropdownText}>{activeSquad?.squad_name}</Text>
              <Ionicons
                name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#1e293b"
              />
            </TouchableOpacity>

            {isDropdownOpen && (
              <View style={styles.dropdown}>
                {squads.map((s) => (
                  <TouchableOpacity
                    key={s.squad_id}
                    style={[
                      styles.dropdownItem,
                      activeSquadId === s.squad_id && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setActiveSquadId(s.squad_id);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        activeSquadId === s.squad_id && styles.dropdownItemTextActive,
                      ]}
                    >
                      {s.squad_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/squad-up')}>
            <Ionicons name="add" size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Your Stats — always visible */}
        <Text style={styles.sectionLabel}>YOUR STATS</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(143,188,143,0.1)' }]}>
              <Ionicons name="calendar" size={20} color="#8fbc8f" />
            </View>
            <View>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>SESSIONS</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(232,165,152,0.1)' }]}>
              <Ionicons name="flame" size={20} color="#e8a598" />
            </View>
            <View>
              <Text style={styles.statValue}>4</Text>
              <Text style={styles.statLabel}>STREAK</Text>
            </View>
          </View>
        </View>

        {squads.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={40} color="#cbd5e1" />
            <Text style={styles.emptyHeading}>You're flying solo</Text>
            <Text style={styles.emptySubtitle}>
              Better together — create a squad to hold each other accountable and crush your goals.
            </Text>
            <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/squad-up')}>
              <Ionicons name="people-outline" size={18} color="#ffffff" />
              <Text style={styles.ctaButtonText}>Create Your Squad</Text>
            </TouchableOpacity>
          </View>
        ) : activeSquad ? (
          <>
            {/* Group Card */}
            <View style={styles.groupCard}>
              <Text style={styles.groupTitle}>Your Squad</Text>

              {activeSquad.squad_type === 'competitive' ? (
                <View style={styles.goalBox}>
                  <Text style={styles.goalLabel}>THIS WEEK'S PUNISHMENT</Text>
                  <Text style={[styles.goalInput, !activeSquad.punishment && styles.goalInputPlaceholder]}>
                    {activeSquad.punishment ?? 'No punishment set'}
                  </Text>
                </View>
              ) : (
                <View style={styles.goalBox}>
                  {(() => {
                    const totalSessions = (activeSquad.squad_members ?? []).reduce(
                      (sum, id) => sum + (profiles[id]?.sessions ?? 0),
                      0
                    );
                    const target = activeSquad.per_week ?? 0;
                    const pct = target > 0 ? Math.min((totalSessions / target) * 100, 100) : 0;
                    return (
                      <>
                        <Text style={styles.goalLabel}>WEEKLY TARGET</Text>
                        <Text style={styles.goalInput}>
                          {target > 0 ? `${target} sessions per week` : 'No target set'}
                        </Text>
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${pct}%` }]} />
                        </View>
                        <Text style={styles.progressText}>
                          {totalSessions} / {target} sessions
                        </Text>
                      </>
                    );
                  })()}
                </View>
              )}

              {/* Members */}
              <View style={styles.memberList}>
                {(() => {
                  const resolved = (activeSquad.squad_members ?? [])
                    .map((id) => ({ id, profile: profiles[id] }))
                    .filter((m) => !!m.profile)
                    .sort((a, b) => (b.profile!.sessions ?? 0) - (a.profile!.sessions ?? 0));

                  const minSessions = resolved.length > 0
                    ? Math.min(...resolved.map((m) => m.profile!.sessions ?? 0))
                    : null;

                  return resolved.map(({ id, profile }, idx) => {
                    const inDanger =
                      activeSquad.squad_type === 'competitive' &&
                      (profile!.sessions ?? 0) === minSessions;
                    return (
                      <TouchableOpacity
                        key={id}
                        style={[styles.memberCard, inDanger && styles.memberCardLast]}
                        onPress={() => setSelectedPerson(profile!)}
                      >
                        <View style={styles.memberLeft}>
                          <Text style={styles.memberRank}>{idx + 1}</Text>
                          <View style={styles.memberAvatar}>
                            <Text style={styles.memberAvatarText}>🧑</Text>
                          </View>
                          <View>
                            <Text style={styles.memberName}>{profile!.display_name}</Text>
                            {inDanger && <Text style={styles.dangerText}>In danger zone! ⚠️</Text>}
                          </View>
                        </View>
                        <View style={styles.memberRight}>
                          <Text style={styles.memberSessions}>{profile!.sessions ?? 0}</Text>
                          <Text style={styles.memberSessionsLabel}>SESSIONS</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  });
                })()}
              </View>
            </View>
          </>
        ) : null}

        <View style={{ height: 24 }} />
      </ScrollView>

      <PersonPopup
        person={selectedPerson}
        isOpen={!!selectedPerson}
        onClose={() => setSelectedPerson(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f5' },
  scroll: { flex: 1, paddingHorizontal: 24 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyHeading: { fontSize: 17, fontWeight: '700', color: '#1e293b', marginTop: 8 },
  emptySubtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#8fbc8f',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  ctaButtonText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 16,
    marginBottom: 24,
    zIndex: 30,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownText: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  dropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    width: 220,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 999,
    overflow: 'hidden',
  },
  dropdownItem: { paddingHorizontal: 16, paddingVertical: 12 },
  dropdownItemActive: { backgroundColor: '#faf8f5' },
  dropdownItemText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  dropdownItemTextActive: { color: '#8fbc8f' },
  addButton: {
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
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  statLabel: { fontSize: 9, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5 },
  groupCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  groupTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  goalBox: {
    backgroundColor: '#faf8f5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  goalLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 1, marginBottom: 8 },
  goalInput: { fontSize: 14, fontWeight: '700', color: '#1e293b', paddingVertical: 4 },
  goalInputPlaceholder: { color: '#cbd5e1' },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: { height: '100%', backgroundColor: '#8fbc8f', borderRadius: 4 },
  progressText: { fontSize: 11, fontWeight: '700', color: '#8fbc8f', marginTop: 6 },
  memberList: { gap: 8 },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  memberCardLast: {
    backgroundColor: 'rgba(232,165,152,0.1)',
    borderColor: 'rgba(232,165,152,0.2)',
  },
  memberLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberRank: { width: 20, fontSize: 14, fontWeight: '700', color: '#94a3b8', textAlign: 'center' },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#faf8f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: { fontSize: 20 },
  memberName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  dangerText: { fontSize: 10, fontWeight: '700', color: '#e8a598' },
  memberRight: { alignItems: 'flex-end' },
  memberSessions: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  memberSessionsLabel: { fontSize: 9, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5 },
});
