export class CryptoUtils {
  /**
   * Generates a canonical SHA-256 hash using the Web Crypto API.
   * Asynchronous, stable, and deterministic.
   * @param content - The cleaned markdown content to hash.
   * @returns A hex string representation of the SHA-256 hash.
   */
  static async generateSHA256Hash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    // Convert ArrayBuffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
  }
}
