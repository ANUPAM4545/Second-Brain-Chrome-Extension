import type { FeatureExtractionPipeline } from '@xenova/transformers';
import type { EmbeddingProvider } from './EmbeddingProvider';

let globalExtractor: FeatureExtractionPipeline | null = null;
let globalInitializingPromise: Promise<void> | null = null;

export class TransformersProvider implements EmbeddingProvider {
  private modelName: string;
  private dimensions: number;
  private extractor: FeatureExtractionPipeline | null = null;
  private onProgress?: (progress: any) => void;

  constructor(
    modelName = 'Xenova/all-MiniLM-L6-v2',
    dimensions = 384,
    onProgress?: (p: any) => void
  ) {
    this.modelName = modelName;
    this.dimensions = dimensions;
    this.onProgress = onProgress;
  }

  async initialize(): Promise<void> {
    if (globalExtractor) {
      this.extractor = globalExtractor;
      return;
    }

    // Prevent multiple concurrent initializations
    if (!globalInitializingPromise) {
      globalInitializingPromise = (async () => {
        try {
          if (this.onProgress) {
            this.onProgress({ status: 'loading', model: this.modelName });
          }

          // Polyfill for onnxruntime-web in Chrome Extension Service Workers
          if (typeof document === 'undefined') {
            (globalThis as any).document = {
              createElement: () => ({}),
              getElementsByTagName: () => [],
              baseURI: '',
              currentScript: null,
            };
          }

          const xenova = await import('@xenova/transformers');
          
          // Optimize environment for browser execution
          xenova.env.allowLocalModels = false;
          // Use browser cache if available in the environment (e.g. not in Happy DOM tests)
          xenova.env.useBrowserCache = typeof caches !== 'undefined';
          
          // Disable web workers to prevent blob: CSP violations in Chrome Extensions
          if (xenova.env.backends?.onnx?.wasm) {
            xenova.env.backends.onnx.wasm.numThreads = 1;
            if (xenova.env.backends.onnx.wasm.proxy !== undefined) {
              xenova.env.backends.onnx.wasm.proxy = false;
            }
          }

          globalExtractor = await xenova.pipeline('feature-extraction', this.modelName, {
            progress_callback: this.onProgress,
          });

          this.extractor = globalExtractor;

          if (this.onProgress) {
            this.onProgress({ status: 'ready', model: this.modelName });
          }
        } catch (error) {
          console.error('[TransformersProvider] Failed to initialize model:', error);
          globalInitializingPromise = null;
          throw error;
        }
      })();
    }

    await globalInitializingPromise;
    this.extractor = globalExtractor;
  }

  async embed(text: string): Promise<number[]> {
    if (!this.extractor) {
      await this.initialize();
    }

    // pooling: 'mean' and normalize: true are standard for sentence-transformers
    const output = await this.extractor!(text, { pooling: 'mean', normalize: true });

    // Output is a Tensor, we want a regular array of numbers
    return Array.from(output.data);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.extractor) {
      await this.initialize();
    }

    if (texts.length === 0) return [];

    const output = await this.extractor!(texts, { pooling: 'mean', normalize: true });

    // output.data is a flat Float32Array. We need to split it by batch size.
    const flatData = Array.from(output.data);
    const vectors: number[][] = [];
    const dim = this.getDimensions();

    for (let i = 0; i < texts.length; i++) {
      const start = i * dim;
      const end = start + dim;
      vectors.push(flatData.slice(start, end));
    }

    return vectors;
  }

  getDimensions(): number {
    return this.dimensions;
  }

  getModelName(): string {
    return this.modelName;
  }

  getProviderName(): string {
    return 'Transformers.js';
  }
}
