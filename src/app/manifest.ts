import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KCM',              // アプリの正式名もKCM
    short_name: 'KCM',         // 📍 アイコンの下に出る名前もKCM
    description: 'KCM Portal',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffc0cb',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}