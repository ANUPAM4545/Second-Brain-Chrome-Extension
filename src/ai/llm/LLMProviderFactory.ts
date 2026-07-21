import { MockLLMProvider } from './MockLLMProvider';
import { GeminiProvider } from './GeminiProvider';
import type { LLMProvider } from './LLMProvider';
import { SettingsConfig } from '../../config/SettingsConfig';

export class LLMProviderFactory {
  static async createProvider(): Promise<LLMProvider> {
    const settings = await SettingsConfig.getSettings();
    if (settings.llmProvider === 'gemini') {
      return new GeminiProvider();
    }
    return new MockLLMProvider();
  }
}
