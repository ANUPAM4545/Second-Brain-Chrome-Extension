export interface AppSettings {
  llmProvider: 'mock' | 'gemini';
  geminiApiKey: string;
  geminiModel: string;
  maxRetrievedChunks: number;
  contextTokenBudget: number;
  developerMode: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  llmProvider: 'mock',
  geminiApiKey: '',
  geminiModel: 'gemini-3.5-flash',
  maxRetrievedChunks: 10,
  contextTokenBudget: 2000,
  developerMode: false,
};

export class SettingsConfig {
  static async getSettings(): Promise<AppSettings> {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const data = await chrome.storage.local.get('appSettings');
      return { ...DEFAULT_SETTINGS, ...((data.appSettings as Partial<AppSettings>) || {}) };
    }
    // Fallback for non-extension environments (like tests)
    return { ...DEFAULT_SETTINGS };
  }

  static async saveSettings(newSettings: Partial<AppSettings>): Promise<void> {
    const current = await this.getSettings();
    const updated = { ...current, ...newSettings };
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ appSettings: updated });
    }
  }

  static async clearSettings(): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.remove('appSettings');
    }
  }
}
