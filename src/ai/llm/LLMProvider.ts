export interface GenerationRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
}

export interface GenerationResponse {
  text: string;
  finishReason: 'stop' | 'length' | 'error';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface GenerationChunk {
  text: string;
  isDone: boolean;
  usage?: GenerationResponse['usage'];
}

export interface ProviderHealth {
  status: 'OK' | 'DEGRADED' | 'FAILED';
  message?: string;
  modelName?: string;
}

export interface LLMProvider {
  initialize(): Promise<void>;
  generate(request: GenerationRequest): Promise<GenerationResponse>;
  stream(request: GenerationRequest): AsyncIterable<GenerationChunk>;
  health(): Promise<ProviderHealth>;
}
