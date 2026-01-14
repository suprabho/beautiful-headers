import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import Scenes from './collections/Scenes.js'

console.log('[PayloadConfig] Scenes collection loaded:', Scenes.slug)
console.log('[PayloadConfig] Scenes hooks:', JSON.stringify(Object.keys(Scenes.hooks || {})))

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default buildConfig({
  collections: [
    {
      slug: 'users',
      auth: true,
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    Scenes,
  ],

  secret: process.env.PAYLOAD_SECRET || 'beautiful-headers-secret-key-change-in-production',

  db: sqliteAdapter({
    client: {
      url: `file:${join(__dirname, 'data', 'payload.db')}`,
    },
  }),
})
