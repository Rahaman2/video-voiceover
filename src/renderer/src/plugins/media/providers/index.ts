/**
 * Register all media providers here.
 * Each provider is isolated — a registration failure won't affect other providers or the app.
 *
 * To add a new provider:
 *   1. Create a file in this directory that exports a MediaProvider
 *   2. Import and add it to the `providers` array below
 */
import { mediaRegistry } from '../registry'
import { pixabayImagesProvider, pixabayVideosProvider } from './pixabay'
import { freesoundProvider } from './freesound'

const providers = [
  pixabayImagesProvider,
  pixabayVideosProvider,
  freesoundProvider,
  // Add new providers here, e.g.:
  // pixabayMusicProvider,  // when Pixabay publishes a music API
  // unsplashProvider,
]

for (const provider of providers) {
  try {
    mediaRegistry.register(provider)
  } catch (e) {
    // A broken provider must not crash the app
    console.error(`[MediaPlugin] Failed to register provider "${provider.id}":`, e)
  }
}
