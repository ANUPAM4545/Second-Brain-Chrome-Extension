export class GenerationMetrics {
  private static instance: GenerationMetrics;

  public timeToFirstToken: number = 0;
  public totalGenerationTime: number = 0;
  public tokensPerSecond: number = 0;
  public promptTokens: number = 0;
  public completionTokens: number = 0;
  public totalTokens: number = 0;

  private constructor() {}

  static getInstance(): GenerationMetrics {
    if (!GenerationMetrics.instance) {
      GenerationMetrics.instance = new GenerationMetrics();
    }
    return GenerationMetrics.instance;
  }

  recordTTFT(ms: number) {
    this.timeToFirstToken = ms;
  }

  recordCompletion(totalTimeMs: number, promptTokens: number, completionTokens: number) {
    this.totalGenerationTime = totalTimeMs;
    this.promptTokens = promptTokens;
    this.completionTokens = completionTokens;
    this.totalTokens = promptTokens + completionTokens;

    if (totalTimeMs > 0) {
      this.tokensPerSecond = (completionTokens / totalTimeMs) * 1000;
    }
  }

  getMetrics() {
    return {
      timeToFirstToken: this.timeToFirstToken,
      totalGenerationTime: this.totalGenerationTime,
      tokensPerSecond: this.tokensPerSecond,
      promptTokens: this.promptTokens,
      completionTokens: this.completionTokens,
      totalTokens: this.totalTokens,
    };
  }
}
