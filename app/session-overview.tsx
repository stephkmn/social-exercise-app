import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { GROUPS } from '../lib/mockData';

export default function SessionOverviewPage() {
  const [selectedGroups, setSelectedGroups] = useState<string[]>(
    GROUPS.map((g) => g.id)
  );
  const [isUploading, setIsUploading] = useState(false);

  const toggleGroup = (id: string) => {
    setSelectedGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedGroups.length === GROUPS.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(GROUPS.map((g) => g.id));
    }
  };

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#475569" />
          </TouchableOpacity>
          <Text style={styles.title}>Ready to post</Text>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600&h=600',
              }}
              style={styles.summaryImage}
            />
            <View style={styles.summaryInfo}>
              <View style={styles.workoutBadge}>
                <Text style={styles.workoutBadgeText}>Yoga 🧘</Text>
              </View>
              <Text style={styles.summaryTime}>Today at 08:30 AM</Text>
              <View style={styles.summaryLabels}>
                {['Yoga Mat', 'Morning'].map((l) => (
                  <View key={l} style={styles.summaryLabel}>
                    <Text style={styles.summaryLabelText}>{l}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Share To */}
        <View style={styles.section}>
          <View style={styles.shareHeader}>
            <Text style={styles.shareTitle}>Share to Squads</Text>
            <TouchableOpacity onPress={toggleAll}>
              <Text style={styles.toggleAllText}>
                {selectedGroups.length === GROUPS.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          </View>

          {GROUPS.map((group) => {
            const isSelected = selectedGroups.includes(group.id);
            return (
              <TouchableOpacity
                key={group.id}
                style={[styles.groupItem, isSelected && styles.groupItemActive]}
                onPress={() => toggleGroup(group.id)}
              >
                <View style={styles.groupLeft}>
                  <View style={[styles.groupEmoji, !isSelected && styles.groupEmojiInactive]}>
                    <Text style={styles.groupEmojiText}>
                      {group.type === 'competitive' ? '🏆' : '🤝'}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.groupName, !isSelected && styles.groupNameInactive]}>
                      {group.name}
                    </Text>
                    <Text style={styles.groupMembers}>{group.members.length} members</Text>
                  </View>
                </View>
                <View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color="#ffffff" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[
            styles.uploadButton,
            (isUploading || selectedGroups.length === 0) && styles.uploadButtonDisabled,
          ]}
          onPress={handleUpload}
          disabled={isUploading || selectedGroups.length === 0}
        >
          <Text style={styles.uploadButtonText}>
            {isUploading ? 'Uploading...' : 'Upload Session'}
          </Text>
          <Ionicons name="cloud-upload" size={20} color="#ffffff" />
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
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  summaryRow: { flexDirection: 'row', gap: 16 },
  summaryImage: {
    width: 96,
    height: 96,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  summaryInfo: { flex: 1, justifyContent: 'center' },
  workoutBadge: {
    backgroundColor: '#faf8f5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  workoutBadgeText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  summaryTime: { fontSize: 13, color: '#64748b', fontWeight: '500', marginBottom: 8 },
  summaryLabels: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  summaryLabel: {
    backgroundColor: 'rgba(143,188,143,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  summaryLabelText: { fontSize: 10, fontWeight: '700', color: '#8fbc8f' },
  section: { marginBottom: 16 },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  shareTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  toggleAllText: { fontSize: 14, fontWeight: '700', color: '#e8a598' },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    opacity: 0.6,
  },
  groupItemActive: {
    backgroundColor: '#ffffff',
    borderColor: '#8fbc8f',
    opacity: 1,
  },
  groupLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  groupEmoji: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#faf8f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupEmojiInactive: { backgroundColor: '#f1f5f9' },
  groupEmojiText: { fontSize: 20 },
  groupName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  groupNameInactive: { color: '#64748b' },
  groupMembers: { fontSize: 12, color: '#94a3b8' },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: { backgroundColor: '#8fbc8f', borderColor: '#8fbc8f' },
  uploadButton: {
    backgroundColor: '#8fbc8f',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  uploadButtonDisabled: { opacity: 0.5 },
  uploadButtonText: { fontSize: 17, fontWeight: '700', color: '#ffffff' },
});
