import { useColorScheme } from 'react-native';

const light = { bg: '#F6F4EE', card: '#FFFFFF', text: '#1B1B1B', sub: '#6B6B6B', border: '#E4E0D5', primary: '#0B7A3B', onPrimary: '#FFFFFF', accent: '#F2B01E', danger: '#C0392B', warn: '#D98200', good: '#0B7A3B', input: '#FAF9F5' };
const dark: typeof light = { bg: '#0F1210', card: '#1A1F1C', text: '#F2F2F2', sub: '#9AA39D', border: '#2A312C', primary: '#35C071', onPrimary: '#0B1A10', accent: '#F2B01E', danger: '#FF6B5E', warn: '#F5A524', good: '#35C071', input: '#141815' };

export type Theme = typeof light;
export const useTheme = (): Theme => (useColorScheme() === 'dark' ? dark : light);
