import type { MediaProvider, MediaType } from './types'

class MediaProviderRegistry {
  private readonly providers = new Map<string, MediaProvider>()

  register(provider: MediaProvider): void {
    this.providers.set(provider.id, provider)
  }

  get(id: string): MediaProvider | undefined {
    return this.providers.get(id)
  }

  getAll(): MediaProvider[] {
    return [...this.providers.values()]
  }

  getByType(type: MediaType): MediaProvider[] {
    return this.getAll().filter(p => p.supportedTypes.includes(type))
  }
}

export const mediaRegistry = new MediaProviderRegistry()
