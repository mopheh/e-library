import { pipeline } from '@xenova/transformers';

class PipelineSingleton {
  static task = 'feature-extraction';
  static model = 'Xenova/all-mpnet-base-v2';
  static instance: any = null;

  static async getInstance(progress_callback?: any) {
    if (this.instance === null) {
      // @ts-ignore
      this.instance = pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

/**
 * Returns the embeddings for the given text using a local ML model.
 * This runs completely offline and avoids all API quotas and costs!
 * @param text The string to embed
 * @returns An array of numbers representing the vector (768 dimensions)
 */
export async function getEmbedding(text: string): Promise<number[]> {
  try {
    const extractor = await PipelineSingleton.getInstance();
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (error) {
    console.error("Local embedding generation failed:", error);
    return [];
  }
}
