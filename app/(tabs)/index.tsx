import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MOCK_FEED } from '../../lib/mockData';
import { FeedCard } from '../../components/FeedCard';

export default function FeedPage() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Squad Feed</Text>
          <Text style={styles.subtitle}>Showing up is half the battle.</Text>
        </View>

        {MOCK_FEED.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerEmoji}>🎉</Text>
          <Text style={styles.footerText}>You're all caught up!</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8f5',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  footerEmoji: {
    fontSize: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
});
