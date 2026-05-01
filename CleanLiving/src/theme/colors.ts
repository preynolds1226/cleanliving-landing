import { useColorScheme } from 'react-native';

export type AppColors = {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  danger: string;
  inverseBg: string;
  inverseText: string;
};

const light: AppColors = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  surface2: '#F1F5F9',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  accent: '#3B82F6',
  accentSoft: '#EEF2FF',
  danger: '#DC2626',
  inverseBg: '#0F172A',
  inverseText: '#FFFFFF',
};

const dark: AppColors = {
  bg: '#0F172A',
  surface: '#1E293B',
  surface2: '#334155',
  border: '#475569',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  accent: '#60A5FA',
  accentSoft: '#312E81',
  danger: '#F87171',
  inverseBg: '#E2E8F0',
  inverseText: '#0F172A',
};

export function useAppColors(): AppColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}
