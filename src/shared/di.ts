// Simple Dependency Injection / Service Locator Foundation
export class Container {
  private static services = new Map<string, any>();

  static register<T>(key: string, instance: T): void {
    this.services.set(key, instance);
  }

  static resolve<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service not found for key: ${key}`);
    }
    return service as T;
  }

  static clear(): void {
    this.services.clear();
  }
}
