const API_BASE = import.meta.env.VITE_CMS_URL || 'http://localhost:3002'

/**
 * Fetch all saved scenes
 */
export async function getScenes() {
  const response = await fetch(`${API_BASE}/api/scenes`)
  if (!response.ok) {
    throw new Error('Failed to fetch scenes')
  }
  return response.json()
}

/**
 * Fetch a single scene by ID
 */
export async function getScene(id) {
  const response = await fetch(`${API_BASE}/api/scenes/${id}`)
  if (!response.ok) {
    throw new Error('Scene not found')
  }
  return response.json()
}

/**
 * Save a new scene
 */
export async function createScene(title, sceneData, thumbnail = null) {
  const response = await fetch(`${API_BASE}/api/scenes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, sceneData, thumbnail }),
  })
  if (!response.ok) {
    throw new Error('Failed to create scene')
  }
  return response.json()
}

/**
 * Update an existing scene
 */
export async function updateScene(id, data) {
  const response = await fetch(`${API_BASE}/api/scenes/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to update scene')
  }
  return response.json()
}

/**
 * Delete a scene
 */
export async function deleteScene(id) {
  const response = await fetch(`${API_BASE}/api/scenes/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Failed to delete scene')
  }
  return response.json()
}

/**
 * Check if CMS server is available
 */
export async function checkCmsHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    })
    return response.ok
  } catch {
    return false
  }
}
