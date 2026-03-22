import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { GROUPS, type Group, type Member } from '../../lib/mockData';
import { PersonPopup } from '../../components/PersonPopup';

export default function LeaderboardPage() {
  const [activeGroupId, setActiveGroupId] = useState(GROUPS[0].id);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Member | null>(null);

  const activeGroup: Group = GROUPS.find((g) => g.id === activeGroupId) ?? GROUPS[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        // Ensure dropdown is not clipped
        nestedScrollEnabled
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <Text style={styles.dropdownText}>{activeGroup.name}</Text>
              <Ionicons
                name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#1e293b"
              />
            </TouchableOpacity>

            {isDropdownOpen && (
              <View style={styles.dropdown}>
                {GROUPS.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    style={[
                      styles.dropdownItem,
                      activeGroupId === g.id && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setActiveGroupId(g.id);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        activeGroupId === g.id && styles.dropdownItemTextActive,
                      ]}
                    >
                      {g.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/add-group')}
          >
            <Ionicons name="add" size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Your Stats */}
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
              <Text style={styles.statLabel}>VARIATIONS</Text>
            </View>
          </View>
        </View>

        {/* Group Card */}
        <View style={styles.groupCard}>
          <Text style={styles.groupTitle}>Your Squad</Text>

          {/* Goal / Punishment */}
          <View style={styles.goalBox}>
            <Text style={styles.goalLabel}>
              {activeGroup.type === 'competitive' ? "THIS WEEK'S PUNISHMENT" : 'GROUP GOAL'}
            </Text>
            <TextInput
              style={styles.goalInput}
              defaultValue={
                activeGroup.type === 'competitive'
                  ? activeGroup.punishment
                  : activeGroup.goal
              }
            />
            {activeGroup.type === 'cooperative' && (
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${activeGroup.progress}%` }]}
                />
              </View>
            )}
          </View>

          {/* Members */}
          <View style={styles.memberList}>
            {activeGroup.members.map((member, idx) => {
              const isLast =
                activeGroup.type === 'competitive' &&
                idx === activeGroup.members.length - 1;
              return (
                <TouchableOpacity
                  key={member.id}
                  style={[styles.memberCard, isLast && styles.memberCardLast]}
                  onPress={() => setSelectedPerson(member)}
                >
                  <View style={styles.memberLeft}>
                    <Text style={styles.memberRank}>{idx + 1}</Text>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>{member.avatar}</Text>
                    </View>
                    <View>
                      <Text style={styles.memberName}>{member.name}</Text>
                      {isLast && (
                        <Text style={styles.dangerText}>In danger zone! ⚠️</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.memberRight}>
                    <Text style={styles.memberSessions}>{member.sessions}</Text>
                    <Text style={styles.memberSessionsLabel}>SESSIONS</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

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
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  goalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 8,
  },
  goalInput: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    paddingVertical: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: { height: '100%', backgroundColor: '#8fbc8f', borderRadius: 4 },
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
  memberRank: {
    width: 20,
    fontSize: 14,
    fontWeight: '700',
    color: '#94a3b8',
    textAlign: 'center',
  },
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
