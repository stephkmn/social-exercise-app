import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { FeedCard } from '../../components/FeedCard';

export default function FeedPage() {
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      // ... existing fetchFeed logic ...
    };

    fetchFeed();
  }, []);

  // New useEffect for real-time profile updates
  useEffect(() => {
    const profileUpdates = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, payload => {
        console.log('Profile updated and pushed!', payload.new);
        const updatedProfile = payload.new;

        setFeed(currentFeed =>
          currentFeed.map(item => {
            // Check if the workout's user matches the updated profile
            if (item.users && item.users.id === updatedProfile.id) {
              return {
                ...item,
                users: {
                  ...item.users,
                  display_name: updatedProfile.display_name,
                  avatar_url: updatedProfile.avatar_url,
                },
              };
            }
            return item;
          })
        );
      })
      .subscribe();

    return () => {
      profileUpdates.unsubscribe();
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Squad Feed</Text>
          <Text style={styles.subtitle}>Showing up is half the battle.</Text>
        </View>

        {feed.map((item) => (
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});