import type { Category } from './types';

export const CATEGORY_COLORS: Record<Category, string> = {
  FOOD: '#f59e0b',
  TRANSPORT: '#3b82f6',
  SHOPPING: '#ec4899',
  BILLS: '#8b5cf6',
  OTHER: '#6b7280',
};

export const CATEGORY_ICONS: Record<Category, string> = {
  FOOD: '🍔',
  TRANSPORT: '🚗',
  SHOPPING: '🛍️',
  BILLS: '📄',
  OTHER: '📦',
};

const FALLBACK_COLOR = '#6b7280';
const FALLBACK_ICON = '📦';

export const categoryColor = (c: string) => CATEGORY_COLORS[c as Category] ?? FALLBACK_COLOR;
export const categoryIcon = (c: string) => CATEGORY_ICONS[c as Category] ?? FALLBACK_ICON;
