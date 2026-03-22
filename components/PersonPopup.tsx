import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type Member } from '../lib/mockData';

interface PersonPopupProps {
  person: Member | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PersonPopup({ person, isOpen, onClose }: PersonPopupProps) {
  if (!person) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.wrapper}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.sheet}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={16} color="#94a3b8" />
          </TouchableOpacity>

          <View style={styles.personHeader}>
            <View style={styles.personAvatar}>
              <Text style={styles.personAvatarText}>{person.avatar}</Text>
            </View>
            <Text style={styles.personName}>{person.name}</Text>
            <Text style={styles.personSubtitle}>Consistency is their superpower ✨</Text>
          </View>

          {/* Usually Does */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="fitness" size={16} color="#8fbc8f" />
              <Text style={styles.sectionTitle}>Usually Does</Text>
            </View>
            <View style={styles.activitiesRow}>
              {['Yoga 🧘', 'Climbing 🧗', 'Biking 🚴'].map((type, idx) => (
                <View key={idx} style={styles.activityTag}>
                  <Text style={styles.activityTagText}>{type}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* This Month */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={16} color="#e8a598" />
              <Text style={styles.sectionTitle}>This Month</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statCardGreen}>
                <Text style={[styles.statValue, { color: '#8fbc8f' }]}>
                  {person.sessions}
                </Text>
                <Text style={styles.statLabel}>Sessions Logged</Text>
              </View>
              <View style={styles.statCardCoral}>
<<<<<<< Updated upstream
                <Text style={[styles.statValue, { color: '#e8a598' }]}>
                  {person.streak}
                </Text>
                <Text style={styles.statLabel}>Week Streak 🔥</Text>
=======
                <Text style={[styles.statValue, { color: '#e8a598' }]}>{person.streaks ?? 0}</Text>
                <Text style={styles.statLabel}>Streak 🔥</Text>
>>>>>>> Stashed changes
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.4)',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 24,
    paddingBottom: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#faf8f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personHeader: { alignItems: 'center', marginTop: 16, marginBottom: 32 },
  personAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#faf8f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  personAvatarText: { fontSize: 40 },
  personName: { fontSize: 24, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  personSubtitle: { fontSize: 13, color: '#64748b' },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  activitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  activityTag: {
    backgroundColor: '#faf8f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  activityTagText: { fontSize: 13, fontWeight: '500', color: '#475569' },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCardGreen: {
    flex: 1,
    backgroundColor: 'rgba(143,188,143,0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(143,188,143,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardCoral: {
    flex: 1,
    backgroundColor: 'rgba(232,165,152,0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(232,165,152,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: 32, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  statLabel: { fontSize: 11, fontWeight: '500', color: '#475569', textAlign: 'center' },
});
