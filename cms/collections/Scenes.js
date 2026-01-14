import { generateSceneMetadata } from '../utils/gemini.js'

/** @type {import('payload').CollectionConfig} */
const Scenes = {
  slug: 'scenes',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'shortDescription', 'createdAt', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        console.log('[Scenes] beforeChange hook triggered')
        console.log('[Scenes] operation:', operation)
        console.log('[Scenes] data keys:', Object.keys(data))
        console.log('[Scenes] data.sceneData exists:', !!data.sceneData)

        // Only generate if fields are empty or this is a create operation
        const shouldGenerate =
          operation === 'create' ||
          (!data.shortDescription && !data.longDescription)

        if (shouldGenerate && data.sceneData) {
          console.log('[Scenes] Generating metadata via Gemini...')
          const metadata = await generateSceneMetadata(data.sceneData)

          if (metadata) {
            // Only override if the field is empty
            if (!data.title || data.title === 'Untitled Scene') {
              data.title = metadata.title
            }
            if (!data.shortDescription) {
              data.shortDescription = metadata.shortDescription
            }
            if (!data.longDescription) {
              data.longDescription = metadata.longDescription
            }
          }
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'shortDescription',
      type: 'text',
      admin: {
        description: 'Brief description for previews (auto-generated if empty)',
      },
    },
    {
      name: 'longDescription',
      type: 'textarea',
      admin: {
        description: 'Detailed description of the scene (auto-generated if empty)',
      },
    },
    {
      name: 'sceneData',
      type: 'json',
      required: true,
      admin: {
        description: 'The complete scene configuration including all layers and effects',
      },
    },
    {
      name: 'thumbnail',
      type: 'json',
      admin: {
        description: 'Thumbnail images in multiple sizes (small, medium, large, full)',
      },
    },
  ],
  timestamps: true,
}

export default Scenes
