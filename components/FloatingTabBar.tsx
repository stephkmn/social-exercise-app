import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router, usePathname } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

const TABS = [
  { name: 'Feed', route: '/(tabs)/', icon: 'home' as const },
  { name: 'Snap', route: '/(tabs)/camera', icon: 'camera' as const },
  { name: 'Squads', route: '/(tabs)/leaderboard', icon: 'trophy' as const },
];

export function FloatingTabBar() {
  const pathname = usePathname();

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <BlurView intensity={60} tint="systemChromeMaterial" style={styles.blur}>
        <View style={styles.inner}>
          {TABS.map((tab) => {
            const isActive =
              tab.route === '/(tabs)/'
                ? pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/'
                : pathname.includes(tab.name.toLowerCase()) ||
                  pathname.includes(tab.route.replace('/(tabs)/', ''));
            return (
              <TouchableOpacity
                key={tab.name}
                style={styles.tab}
                onPress={() => router.push(tab.route as any)}
                activeOpacity={0.7}
              >
                {isActive && <View style={styles.activePill} />}
                <Ionicons
                  name={tab.icon}
                  size={26}
                  color={isActive ? '#8fbc8f' : '#94a3b8'}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  blur: {
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.4)',
    ...Platform.select({
      android: { backgroundColor: 'rgba(255,255,255,0.85)' },
    }),
  },
  inner: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    width: 72,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    position: 'absolute',
    width: 64,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(143,188,143,0.18)',
  },
});
