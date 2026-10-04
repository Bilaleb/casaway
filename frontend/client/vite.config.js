import { createReadStream, existsSync } from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

const imageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../libassi images')

const localImages = {
  name: 'libassi-local-images',
  configureServer(server) {
    server.middlewares.use('/images', (request, response, next) => {
      let imageName
      try {
        imageName = decodeURIComponent((request.url || '/').split('?')[0].slice(1))
      } catch {
        return next()
      }

      const requestedImage = path.resolve(imageDirectory, imageName)
      if (!requestedImage.startsWith(`${imageDirectory}${path.sep}`)) return next()

      const enhancedImage = path.join(imageDirectory, 'enhanced', `${path.parse(path.basename(imageName)).name}.webp`)
      const imagePath = imageName.startsWith('enhanced/') ? requestedImage : existsSync(enhancedImage) ? enhancedImage : requestedImage
      if (!existsSync(imagePath)) return next()

      response.setHeader('Content-Type', path.extname(imagePath) === '.webp' ? 'image/webp' : 'image/jpeg')
      response.setHeader('Cache-Control', 'public, max-age=86400')
      createReadStream(imagePath).on('error', next).pipe(response)
    })
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    localImages,
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
