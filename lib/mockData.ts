export const FRIENDS = [
  { id: '1', name: 'Alex', avatar: '🧑‍🦱' },
  { id: '2', name: 'Jordan', avatar: '👩‍🦰' },
  { id: '3', name: 'Sam', avatar: '🧑' },
  { id: '4', name: 'Riley', avatar: '👩' },
  { id: '5', name: 'Morgan', avatar: '🧔' },
];

export interface Member {
  id: string;
  name: string;
  avatar: string;
  sessions: number;
  streak: number;
}

export interface CompetitiveGroup {
  id: string;
  name: string;
  type: 'competitive';
  punishment: string;
  members: Member[];
}

export interface CooperativeGroup {
  id: string;
  name: string;
  type: 'cooperative';
  goal: string;
  progress: number;
  members: Member[];
}

export type Group = CompetitiveGroup | CooperativeGroup;

export const GROUPS: Group[] = [
  {
    id: 'g1',
    name: 'Morning Crew',
    type: 'competitive',
    punishment: 'Loser buys smoothies 🥤',
    members: [
      { ...FRIENDS[0], sessions: 12, streak: 4 },
      { ...FRIENDS[1], sessions: 10, streak: 2 },
      { ...FRIENDS[2], sessions: 8, streak: 1 },
    ],
  },
  {
    id: 'g2',
    name: 'Yoga Squad',
    type: 'cooperative',
    goal: '30 sessions this month',
    progress: 67,
    members: [
      { ...FRIENDS[0], sessions: 8, streak: 3 },
      { ...FRIENDS[3], sessions: 7, streak: 2 },
      { ...FRIENDS[4], sessions: 5, streak: 1 },
    ],
  },
  {
    id: 'g3',
    name: 'Weekend Warriors',
    type: 'competitive',
    punishment: 'Last place does 50 burpees 💪',
    members: [
      { ...FRIENDS[1], sessions: 5, streak: 2 },
      { ...FRIENDS[2], sessions: 4, streak: 1 },
      { ...FRIENDS[3], sessions: 4, streak: 1 },
      { ...FRIENDS[4], sessions: 2, streak: 0 },
    ],
  },
];

export const EXERCISE_TYPES = [
  'Yoga 🧘',
  'Climbing 🧗',
  'Biking 🚴',
  'Weightlifting 🏋️',
  'Running 🏃',
  'Swimming 🏊',
  'Other 🎯',
];

export const MOCK_FEED = [
  {
    id: 'f1',
    user: FRIENDS[1],
    timeAgo: '2h ago',
    image:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600&h=600',
    labels: ['Yoga Mat', 'Indoor', 'Morning'],
    workoutType: 'Yoga 🧘',
    encouragement: 'Crushing that morning flow! ✨',
  },
  {
    id: 'f2',
    user: FRIENDS[3],
    timeAgo: '4h ago',
    image:
      'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&q=80&w=600&h=600',
    labels: ['Chalk', 'Wall', 'Vertical'],
    workoutType: 'Climbing 🧗',
    encouragement: 'Reaching new heights! 🧗‍♀️',
  },
  {
    id: 'f3',
    user: FRIENDS[0],
    timeAgo: 'Yesterday',
    image:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=600&h=600',
    labels: ['Dumbbells', 'Gym', 'Heavy'],
    workoutType: 'Weightlifting 🏋️',
    encouragement: 'Consistency is key! 💪',
  },
];
