import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { EXERCISE_TYPES, FRIENDS } from '../lib/mockData';

export default function SessionFormPage() {
  const [selectedTags, setSelectedTags] = useState<string[]>(['Yoga 🧘']);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleFriend = (id: string) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#475569" />
          </TouchableOpacity>
          <Text style={styles.title}>Details</Text>
        </View>

        {/* Date & Time */}
        <View style={styles.dateTimeRow}>
          <View style={styles.infoCard}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(143,188,143,0.1)' }]}>
              <Ionicons name="calendar" size={20} color="#8fbc8f" />
            </View>
            <View>
              <Text style={styles.fieldLabel}>DATE</Text>
              <Text style={styles.fieldValue}>Today</Text>
            </View>
          </View>
          <View style={styles.infoCard}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(232,165,152,0.1)' }]}>
              <Ionicons name="time" size={20} color="#e8a598" />
            </View>
            <View>
              <Text style={styles.fieldLabel}>TIME</Text>
              <Text style={styles.fieldValue}>08:30 AM</Text>
            </View>
          </View>
        </View>

        {/* Location */}
        <View style={styles.locationCard}>
          <View style={styles.locationIcon}>
            <Ionicons name="location" size={20} color="#94a3b8" />
          </View>
          <TextInput
            placeholder="Add location..."
            placeholderTextColor="#94a3b8"
            style={styles.locationInput}
          />
        </View>

        {/* Workout Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What did you do?</Text>
          <View style={styles.tagsWrap}>
            {EXERCISE_TYPES.map((tag) => (
              <TouchableOpacity
                key={tag}
                onPress={() => toggleTag(tag)}
                style={[styles.tag, selectedTags.includes(tag) && styles.tagActive]}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedTags.includes(tag) && styles.tagTextActive,
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tag Friends */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>With anyone?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.friendsRow}>
              {FRIENDS.map((friend) => {
                const isSelected = selectedFriends.includes(friend.id);
                return (
                  <TouchableOpacity
                    key={friend.id}
                    onPress={() => toggleFriend(friend.id)}
                    style={[styles.friendItem, isSelected && styles.friendItemActive]}
                  >
                    <View style={[styles.friendAvatar, isSelected && styles.friendAvatarActive]}>
                      <Text style={styles.friendEmoji}>{friend.avatar}</Text>
                    </View>
                    <Text style={[styles.friendName, isSelected && styles.friendNameActive]}>
                      {friend.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => router.push('/session-overview')}
        >
          <Text style={styles.nextButtonText}>Review</Text>
          <Ionicons name="arrow-forward" size={20} color="#ffffff" />
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
  dateTimeRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  infoCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: { fontSize: 9, fontWeight: '700', color: '#94a3b8', letterSpacing: 1 },
  fieldValue: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  locationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 8,
    marginBottom: 24,
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
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#faf8f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  locationInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
    marginLeft: 4,
  },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  tagActive: { backgroundColor: '#8fbc8f', borderColor: '#8fbc8f' },
  tagText: { fontSize: 13, fontWeight: '500', color: '#475569' },
  tagTextActive: { color: '#ffffff' },
  friendsRow: { flexDirection: 'row', gap: 12, paddingBottom: 8 },
  friendItem: {
    alignItems: 'center',
    gap: 6,
    minWidth: 64,
    padding: 8,
    borderRadius: 16,
  },
  friendItemActive: {
    backgroundColor: '#faf8f5',
    borderWidth: 1,
    borderColor: 'rgba(232,165,152,0.3)',
  },
  friendAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  friendAvatarActive: { borderWidth: 2, borderColor: '#e8a598' },
  friendEmoji: { fontSize: 24 },
  friendName: { fontSize: 11, fontWeight: '500', color: '#64748b' },
  friendNameActive: { color: '#e8a598' },
  nextButton: {
    backgroundColor: '#8fbc8f',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  nextButtonText: { fontSize: 17, fontWeight: '700', color: '#ffffff' },
});
