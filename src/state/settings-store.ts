import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  notificationsEnabled: boolean;
  language: 'ar' | 'en';
  theme: 'light' | 'dark' | 'system';

  loadSettings: () => Promise<void>;
  updateSetting: <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K],
  ) => Promise<void>;
}

const STORAGE_KEY = 'yawmi_settings';

const defaults: Omit<SettingsState, 'loadSettings' | 'updateSetting'> = {
  notificationsEnabled: true,
  language: 'ar',
  theme: 'system',
};

export const useSettingsStore = create<SettingsState>((set) => ({
  ...defaults,

  loadSettings: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({ ...defaults, ...parsed });
      }
    } catch {
      set({ ...defaults });
    }
  },

  updateSetting: async (key, value) => {
    set({ [key]: value } as Partial<SettingsState>);
    try {
      const current = useSettingsStore.getState();
      const { loadSettings, updateSetting, ...persistable } = current;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
    } catch {
      // silently fail
    }
  },
}));
