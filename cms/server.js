import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { getPayload } from 'payload'
import config from './payload.config.js'
import { mkdir, unlink, readdir } from 'fs/promises'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const THUMBNAILS_DIR = join(__dirname, 'thumbnails')

// Thumbnail sizes to generate
const THUMBNAIL_SIZES = {
  small: 400,   // For listing/preview
  medium: 800,  // For cards
  large: 1200,  // For detail view
  full: null,   // Original size
}

const app = express()
const PORT = process.env.CMS_PORT || 3002

// Enable CORS for the Vite frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
}))

app.use(express.json({ limit: '50mb' }))

let payload

// Health check - register before payload
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Serve thumbnail images statically
app.use('/thumbnails', express.static(THUMBNAILS_DIR))

// Helper: Save base64 thumbnail as JPG files in multiple sizes
async function saveThumbnail(base64Data, sceneId) {
  if (!base64Data) return null

  // Ensure thumbnails directory exists
  if (!existsSync(THUMBNAILS_DIR)) {
    await mkdir(THUMBNAILS_DIR, { recursive: true })
  }

  // Remove data URL prefix if present
  const base64String = base64Data.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64String, 'base64')

  const thumbnails = {}

  // Generate thumbnails for each size
  for (const [sizeName, width] of Object.entries(THUMBNAIL_SIZES)) {
    const filename = `${sceneId}-${sizeName}.jpg`
    const filepath = join(THUMBNAILS_DIR, filename)

    if (width) {
      // Resize to specified width, maintaining aspect ratio
      await sharp(buffer)
        .resize(width, null, { withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toFile(filepath)
    } else {
      // Full size - just convert to optimized JPEG
      await sharp(buffer)
        .jpeg({ quality: 90 })
        .toFile(filepath)
    }

    thumbnails[sizeName] = `/thumbnails/${filename}`
  }

  return thumbnails
}

// Helper: Delete all thumbnail files for a scene
async function deleteThumbnail(sceneId) {
  for (const sizeName of Object.keys(THUMBNAIL_SIZES)) {
    const filepath = join(THUMBNAILS_DIR, `${sceneId}-${sizeName}.jpg`)
    if (existsSync(filepath)) {
      await unlink(filepath)
    }
  }
}

// Create router for scene endpoints
const scenesRouter = express.Router()

// API: Get all scenes
scenesRouter.get('/', async (req, res) => {
  try {
    const scenes = await payload.find({
      collection: 'scenes',
      sort: '-createdAt',
      limit: 100,
    })
    res.json(scenes)
  } catch (error) {
    console.error('Error fetching scenes:', error)
    res.status(500).json({ error: 'Failed to fetch scenes' })
  }
})

// API: Get single scene
scenesRouter.get('/:id', async (req, res) => {
  try {
    const scene = await payload.findByID({
      collection: 'scenes',
      id: req.params.id,
    })
    res.json(scene)
  } catch (error) {
    console.error('Error fetching scene:', error)
    res.status(404).json({ error: 'Scene not found' })
  }
})

// API: Create scene
scenesRouter.post('/', async (req, res) => {
  try {
    const { title, sceneData, thumbnail } = req.body

    if (!title || !sceneData) {
      return res.status(400).json({ error: 'Title and sceneData are required' })
    }

    // Create scene first to get the ID
    const scene = await payload.create({
      collection: 'scenes',
      data: {
        title,
        sceneData,
        thumbnail: null,
      },
    })

    // Save thumbnail as file if provided
    if (thumbnail) {
      const thumbnailPath = await saveThumbnail(thumbnail, scene.id)
      // Update scene with thumbnail path
      const updatedScene = await payload.update({
        collection: 'scenes',
        id: scene.id,
        data: { thumbnail: thumbnailPath },
      })
      return res.status(201).json(updatedScene)
    }

    res.status(201).json(scene)
  } catch (error) {
    console.error('Error creating scene:', error)
    res.status(500).json({ error: 'Failed to create scene' })
  }
})

// API: Update scene
scenesRouter.patch('/:id', async (req, res) => {
  try {
    const { title, sceneData, thumbnail } = req.body
    const scene = await payload.update({
      collection: 'scenes',
      id: req.params.id,
      data: {
        ...(title && { title }),
        ...(sceneData && { sceneData }),
        ...(thumbnail !== undefined && { thumbnail }),
      },
    })
    res.json(scene)
  } catch (error) {
    console.error('Error updating scene:', error)
    res.status(500).json({ error: 'Failed to update scene' })
  }
})

// API: Delete scene
scenesRouter.delete('/:id', async (req, res) => {
  try {
    // Delete thumbnail file first
    await deleteThumbnail(req.params.id)

    await payload.delete({
      collection: 'scenes',
      id: req.params.id,
    })
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting scene:', error)
    res.status(500).json({ error: 'Failed to delete scene' })
  }
})

// Mount router before initializing Payload
app.use('/api/scenes', scenesRouter)

async function start() {
  // Initialize Payload
  payload = await getPayload({ config })

  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║   Beautiful Headers CMS Server                        ║
║   Running on http://localhost:${PORT}                    ║
║                                                       ║
║   API Endpoints:                                      ║
║   GET    /api/scenes      - List all scenes           ║
║   GET    /api/scenes/:id  - Get single scene          ║
║   POST   /api/scenes      - Create new scene          ║
║   PATCH  /api/scenes/:id  - Update scene              ║
║   DELETE /api/scenes/:id  - Delete scene              ║
╚═══════════════════════════════════════════════════════╝
    `)
  })
}

start().catch(console.error)
