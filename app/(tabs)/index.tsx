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
      try {
        const { data, error } = await supabase
          .from('workouts')
          .select(`
            id,
            created_at,
            photo_url,
            cv_detected_items,
            users (
              id,
              display_name,
              avatar_url
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setFeed(data);
      } catch (error) {
        console.error('Error fetching feed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

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