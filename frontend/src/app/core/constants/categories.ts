export interface Category {
  id: string;
  name: string;
  emoji: string;
  slug: string;
}

export const CATEGORIES: Category[] = [
  { id: 'funny', name: 'Funny', emoji: '😂', slug: 'funny' },
  { id: 'gaming', name: 'Gaming', emoji: '🎮', slug: 'gaming' },
  { id: 'programming', name: 'Programming', emoji: '💻', slug: 'programming' },
  { id: 'dank', name: 'Dank', emoji: '🌚', slug: 'dank' },
  { id: 'wholesome', name: 'Wholesome', emoji: '🥰', slug: 'wholesome' },
];