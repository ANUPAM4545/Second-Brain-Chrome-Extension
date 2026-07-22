import type { LLMProvider, GenerationRequest, GenerationResponse, GenerationChunk, ProviderHealth } from './LLMProvider';
import { SettingsConfig } from '../../config/SettingsConfig';

export class GeminiProvider implements LLMProvider {
  private apiKey: string = '';
  private modelName: string = 'gemini-3.5-flash';
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta/models';

  async initialize(): Promise<void> {
    const settings = await SettingsConfig.getSettings();
    if (!settings.geminiApiKey) {
      throw new Error('Gemini API Key is missing. Please configure it in the Extension Settings.');
    }
    this.apiKey = settings.geminiApiKey;
    this.modelName = settings.geminiModel || 'gemini-3.5-flash';
  }

  private buildPayload(request: GenerationRequest) {
    const contents = [];
    if (request.systemPrompt) {
      // System instructions in Gemini API are passed via system_instruction field
      contents.push({ role: 'user', parts: [{ text: `SYSTEM INSTRUCTIONS: ${request.systemPrompt}\n\nUSER PROMPT: ${request.prompt}` }] });
    } else {
      contents.push({ role: 'user', parts: [{ text: request.prompt }] });
    }

    return {
      contents,
      generationConfig: {
        maxOutputTokens: request.maxTokens || 1024,
        temperature: request.temperature || 0.2, // low temp for RAG
        stopSequences: request.stopSequences || []
      }
    };
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    if (!this.apiKey) await this.initialize();

    const url = `${this.baseUrl}/${this.modelName}:generateContent?key=${this.apiKey}`;
    const payload = this.buildPayload(request);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gemini API Error: ${res.status} ${errorText}`);
    }

    const data = await res.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Gemini API returned no candidates.');
    }

    const candidate = data.candidates[0];
    const text = candidate.content?.parts?.[0]?.text || '';
    
    let finishReason: 'stop' | 'length' | 'error' = 'stop';
    if (candidate.finishReason === 'MAX_TOKENS') finishReason = 'length';
    else if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'RECITATION') finishReason = 'error';

    const usageMetadata = data.usageMetadata || {};

    return {
      text,
      finishReason,
      usage: {
        promptTokens: usageMetadata.promptTokenCount || 0,
        completionTokens: usageMetadata.candidatesTokenCount || 0,
        totalTokens: usageMetadata.totalTokenCount || 0
      }
    };
  }

  async *stream(request: GenerationRequest): AsyncIterable<GenerationChunk> {
    if (!this.apiKey) await this.initialize();

    const url = `${this.baseUrl}/${this.modelName}:streamGenerateContent?key=${this.apiKey}&alt=sse`;
    const payload = this.buildPayload(request);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gemini Streaming API Error: ${res.status} ${errorText}`);
    }

    if (!res.body) throw new Error('ReadableStream not supported by browser.');

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\\n');
      buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer

      for (const line of lines) {
        if (line.trim().startsWith('data: ')) {
          const dataStr = line.replace('data: ', '').trim();
          if (dataStr === '[DONE]') break;
          
          try {
            const data = JSON.parse(dataStr);
            const candidate = data.candidates?.[0];
            const text = candidate?.content?.parts?.[0]?.text;
            
            if (text) {
              const usage = data.usageMetadata;
              yield {
                text,
                isDone: false,
                usage: usage ? {
                  promptTokens: usage.promptTokenCount || 0,
                  completionTokens: usage.candidatesTokenCount || 0,
                  totalTokens: usage.totalTokenCount || 0
                } : undefined
              };
            }
          } catch (err) {
            console.warn('Failed to parse Gemini SSE chunk', err);
          }
        }
      }
    }
    
    // Final chunk to signal completion
    yield { text: '', isDone: true };
  }

  async health(): Promise<ProviderHealth> {
    try {
      const settings = await SettingsConfig.getSettings();
      if (!settings.geminiApiKey) {
        return { status: 'DEGRADED', message: 'API Key missing' };
      }
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${settings.geminiApiKey}`;
      const res = await fetch(url);
      
      if (res.ok) {
        const data = await res.json();
        const models = data.models || [];
        const targetModelId = `models/${this.modelName}`;
        const found = models.find((m: any) => m.name === targetModelId);
        
        if (found) {
          if (!found.supportedGenerationMethods.includes('generateContent')) {
            return { status: 'FAILED', message: `Model exists but does not support generateContent`, modelName: this.modelName };
          }
          return { status: 'OK', modelName: this.modelName };
        } else {
          return { status: 'FAILED', message: `Model ${this.modelName} not found in available models. Try 'gemini-pro'.`, modelName: this.modelName };
        }
      } else {
        const errorText = await res.text();
        return { status: 'FAILED', message: `HTTP ${res.status} ${errorText}`, modelName: this.modelName };
      }
    } catch (e: any) {
      return { status: 'FAILED', message: e.message, modelName: this.modelName };
    }
  }
}
