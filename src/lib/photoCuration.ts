import chroma from 'chroma-js'
import { Photo } from '@/types'

/**
 * Photo characteristics from AI analysis JSON stored in photos.data column
 */
export interface PhotoCharacteristics {
  photo_id: string
  filename: string
  description?: string
  scene?: string
  dominant_colors: string[]
  people_count: number
}

/**
 * JSON structure from photos.data column - directly corresponds to the photo row
 */
interface PhotoDataJSON {
  filename?: string
  description?: string
  scene?: string
  dominant_colors?: string[]
  people_count?: number
  people?: any[]
}

/**
 * Enhanced photo with curation metadata
 */
export interface CuratedPhoto extends Photo {
  baseColor?: [number, number, number] // RGB vector
  score?: number
  role?: 'intro' | 'transition' | 'climax' | 'closing'
  characteristics?: PhotoCharacteristics
}

/**
 * Extract characteristics from photo JSON data
 * The data column directly contains the image data for this photo row
 */
function extractCharacteristicsFromPhoto(photo: Photo & { data?: any }): PhotoCharacteristics | null {
  if (!photo.data) return null

  try {
    const data: PhotoDataJSON = typeof photo.data === 'string' ? JSON.parse(photo.data) : photo.data
    return {
      photo_id: photo.id,
      filename: data.filename || photo.name,
      description: data.description,
      scene: data.scene,
      dominant_colors: data.dominant_colors || [],
      people_count: data.people_count || 0
    }
  } catch (e) {
    console.warn(`Failed to parse JSON data for photo ${photo.id}:`, e)
    return null
  }
}

/**
 * Convert a human-readable color string (e.g. "soft white", "dark gray") into RGB.
 * Tries chroma-js first; if that fails, falls back to a set of known names and adjective parsing.
 */
function parseColorToRGB(colorDescription: string | undefined): [number, number, number] | null {
  if (!colorDescription) return null

  const value = colorDescription.trim().toLowerCase()
  if (!value) return null

  try {
    return chroma(value).rgb() as [number, number, number]
  } catch {
    // Continue to fallback handling
  }

  const baseColorMap: Record<string, string> = {
    black: '#000000',
    'dark gray': '#4a4a4a',
    'dark grey': '#4a4a4a',
    gray: '#808080',
    grey: '#808080',
    'light gray': '#d3d3d3',
    'light grey': '#d3d3d3',
    white: '#ffffff',
    'soft white': '#f5f5f5',
    'off white': '#f8f8f2',
    ivory: '#fffff0',
    beige: '#f5f5dc',
    cream: '#fffdd0',
    red: '#ff0000',
    blue: '#0000ff',
    green: '#008000',
    yellow: '#ffff00',
    orange: '#ffa500',
    purple: '#800080',
    pink: '#ffc0cb',
    brown: '#8b4513',
    teal: '#008080',
    cyan: '#00ffff',
    magenta: '#ff00ff',
    maroon: '#800000',
    navy: '#000080',
    indigo: '#4b0082',
    violet: '#ee82ee',
    gold: '#ffd700',
    silver: '#c0c0c0',
    bronze: '#cd7f32'
  }

  if (baseColorMap[value]) {
    return chroma(baseColorMap[value]).rgb() as [number, number, number]
  }

  const adjectives = ['soft', 'dark', 'light', 'muted', 'deep', 'rich', 'bright', 'pale', 'warm', 'cool']
  const words = value.split(/\s+/).filter(Boolean)
  const filteredWords = words.filter(word => !adjectives.includes(word))
  const base = filteredWords.join(' ')

  if (baseColorMap[base]) {
    let color = chroma(baseColorMap[base])
    if (value.includes('dark')) {
      color = color.darken(1)
    } else if (value.includes('light') || value.includes('soft') || value.includes('pale')) {
      color = color.brighten(0.8)
    } else if (value.includes('muted')) {
      color = color.desaturate(1)
    }
    return color.rgb() as [number, number, number]
  }

  for (const word of filteredWords) {
    if (baseColorMap[word]) {
      let color = chroma(baseColorMap[word])
      if (value.includes('dark')) {
        color = color.darken(1)
      } else if (value.includes('light') || value.includes('soft') || value.includes('pale')) {
        color = color.brighten(0.8)
      } else if (value.includes('muted')) {
        color = color.desaturate(1)
      }
      return color.rgb() as [number, number, number]
    }
  }

  return null
}

/**
 * Score photo for Color Story algorithm
 * Criteria: color vibrancy, color diversity, color harmony potential
 */
function scorePhotoForColorStory(photo: CuratedPhoto, allPhotos: CuratedPhoto[]): number {
  if (!photo.baseColor || !photo.characteristics) return 0

  let score = 0

  // 1. Color vibrancy/saturation (0-30 points)
  try {
    const primaryColorRGB = parseColorToRGB(photo.characteristics.dominant_colors[0])
    if (!primaryColorRGB) throw new Error('Unable to parse color')
    const color = chroma(primaryColorRGB)
    const hsl = color.hsl()
    const saturation = Array.isArray(hsl) ? hsl[1] || 0 : 0 // Saturation 0-1
    const lightness = Array.isArray(hsl) ? hsl[2] || 0 : 0 // Lightness 0-1
    
    // Prefer vibrant but not too dark or too light colors
    const vibrancyScore = saturation * 20 // Max 20 points
    const lightnessScore = (1 - Math.abs(lightness - 0.5) * 2) * 10 // Max 10 points (prefer mid-tones)
    score += vibrancyScore + lightnessScore
  } catch (e) {
    // If color parsing fails, give minimal score
    score += 5
  }

  // 2. Multiple dominant colors (0-20 points)
  const colorCount = photo.characteristics.dominant_colors.length
  score += Math.min(colorCount * 5, 20) // Up to 4 colors = 20 points

  // 3. Color uniqueness/diversity (0-25 points)
  // Score higher if this color is less common in the collection
  const similarColorCount = allPhotos.filter(p => {
    if (!p.baseColor) return false
    const dist = euclideanDistance(photo.baseColor!, p.baseColor!)
    return dist < 60 // Similar color threshold
  }).length
  
  // Inverse: fewer similar colors = higher score
  const uniquenessScore = Math.max(0, 25 - (similarColorCount - 1) * 2)
  score += uniquenessScore

  // 4. Scene quality indicator (0-15 points)
  const scene = photo.characteristics.scene?.toLowerCase() || ''
  if (scene.includes('portrait') || scene.includes('people')) score += 8
  if (scene.includes('landscape') || scene.includes('nature')) score += 7
  if (scene.includes('coast') || scene.includes('beach')) score += 6
  if (photo.characteristics.people_count > 0) score += 5

  // 5. Description quality (0-10 points)
  if (photo.characteristics.description && photo.characteristics.description.length > 50) {
    score += 10
  } else if (photo.characteristics.description) {
    score += 5
  }

  return Math.round(score * 10) / 10 // Round to 1 decimal
}

/**
 * Color Story Algorithm
 * Clusters all photos into groups of maxPhotos size based on color similarity
 * Returns all clusters as separate albums (e.g., one album of black/white photos, another of blue photos)
 */
export function curateByColorStory(
  photos: (Photo & { data?: any })[],
  maxPhotos: number = 50,
  colorThreshold: number = 80
): Photo[][] {
  // Extract characteristics and convert colors to RGB
  const enhancedPhotos: CuratedPhoto[] = photos.map(photo => {
    const char = extractCharacteristicsFromPhoto(photo)
    if (!char || !char.dominant_colors || char.dominant_colors.length === 0) {
      return { ...photo, baseColor: [0, 0, 0], score: 0 }
    }

    let baseColor: [number, number, number] | null = null
    for (const colorName of char.dominant_colors) {
      baseColor = parseColorToRGB(colorName)
      if (baseColor) break
    }

    if (!baseColor) {
      return { ...photo, baseColor: [0, 0, 0], score: 0, characteristics: char }
    }

    return {
      ...photo,
      baseColor,
      characteristics: char,
      score: 0
    }
  })

  // Filter out photos without valid color data
  const photosWithColors = enhancedPhotos.filter(p => 
    p.baseColor && p.baseColor[0] !== 0 && p.baseColor[1] !== 0 && p.baseColor[2] !== 0
  )
  
  if (photosWithColors.length === 0) {
    return [photos.slice(0, maxPhotos)]
  }

  // Score all photos for quality
  photosWithColors.forEach(photo => {
    photo.score = scorePhotoForColorStory(photo, photosWithColors)
  })

  // Cluster by color similarity into groups of maxPhotos size
  const albumClusters = clusterIntoAlbums(photosWithColors, maxPhotos, colorThreshold)

  if (albumClusters.length === 0) {
    // Fallback: return top-scoring photos if no clusters found
    return [photosWithColors
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, maxPhotos)
      .map(p => {
        const { baseColor, score, role, characteristics, ...photo } = p
        return photo
      })]
  }
  console.log('Color clusters:', albumClusters.map(c => c.length));
  // Score each album cluster and sort by score
  const scoredAlbums = albumClusters.map(cluster => ({
    cluster,
    score: calculateClusterScore(cluster, maxPhotos)
  })).sort((a, b) => b.score - a.score)

  // Fill any clusters that are too small
  const filledClusters = scoredAlbums.map(({ cluster }) => {
    // If cluster is too small, try to fill it with remaining photos
    if (cluster.length < maxPhotos && cluster.length < photosWithColors.length) {
      const usedIds = new Set(cluster.map(p => p.id))
      const remaining = photosWithColors
        .filter(p => !usedIds.has(p.id))
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, maxPhotos - cluster.length)
      
      return [...cluster, ...remaining]
    }
    return cluster
  })

  // Return all clusters as separate albums
  return filledClusters.map(cluster => 
    cluster.map(p => {
      const { baseColor, score, role, characteristics, ...photo } = p
      return photo
    })
  )
}

/**
 * Cluster photos into album-sized groups based on color similarity
 */
function clusterIntoAlbums(
  photos: CuratedPhoto[],
  maxPhotos: number,
  colorThreshold: number
): CuratedPhoto[][] {
  const albums: CuratedPhoto[][] = []
  const usedPhotos = new Set<string>()

  // Sort photos by score (descending) to prioritize better photos
  const sortedPhotos = [...photos].sort((a, b) => (b.score || 0) - (a.score || 0))

  for (const seedPhoto of sortedPhotos) {
    if (usedPhotos.has(seedPhoto.id)) continue
    if (!seedPhoto.baseColor) continue

    // Start a new album cluster with this seed photo
    const album: CuratedPhoto[] = [seedPhoto]

    // First pass: Find photos with strict similarity (within colorThreshold)
    for (const candidate of sortedPhotos) {
      if (album.length >= maxPhotos) break
      if (usedPhotos.has(candidate.id)) continue
      if (candidate.id === seedPhoto.id) continue // Skip seed photo
      if (!candidate.baseColor) continue

      // Check if candidate is similar to any photo in the current album
      const isSimilar = album.some(albumPhoto => {
        if (!albumPhoto.baseColor) return false
        const dist = euclideanDistance(candidate.baseColor!, albumPhoto.baseColor!)
        return dist < colorThreshold
      })

      if (isSimilar) {
        album.push(candidate)
      }
    }

    // Second pass: If album is still small, relax threshold to fill it up
    if (album.length < maxPhotos) {
      const relaxedThreshold = colorThreshold * 1.5 // 50% more lenient
      
      for (const candidate of sortedPhotos) {
        if (album.length >= maxPhotos) break
        if (usedPhotos.has(candidate.id)) continue
        if (album.some(p => p.id === candidate.id)) continue // Skip if already in album
        if (!candidate.baseColor) continue

        // Check if candidate is somewhat similar to any photo in the current album
        const isSomewhatSimilar = album.some(albumPhoto => {
          if (!albumPhoto.baseColor) return false
          const dist = euclideanDistance(candidate.baseColor!, albumPhoto.baseColor!)
          return dist < relaxedThreshold
        })

        if (isSomewhatSimilar) {
          album.push(candidate)
        }
      }
    }

    // Third pass: If still not full, add closest photos by color distance
    if (album.length < maxPhotos) {
      const remaining = sortedPhotos
        .filter(p => !usedPhotos.has(p.id) && !album.some(a => a.id === p.id) && p.baseColor)
        .map(candidate => {
          // Find minimum distance to any photo in current album
          const minDist = Math.min(
            ...album
              .filter(p => p.baseColor)
              .map(albumPhoto => euclideanDistance(candidate.baseColor!, albumPhoto.baseColor!))
          )
          return { candidate, minDist }
        })
        .sort((a, b) => a.minDist - b.minDist) // Sort by closest first
        .slice(0, maxPhotos - album.length)

      remaining.forEach(({ candidate }) => {
        album.push(candidate)
      })
    }

    // Only add albums that have at least maxPhotos/2 photos (or minimum 2)
    const minAlbumSize = Math.max(2, Math.ceil(maxPhotos * 0.5))
    if (album.length >= minAlbumSize) {
      albums.push(album)
      // Mark all photos in this album as used
      album.forEach(photo => usedPhotos.add(photo.id))
    }
  }

  // If we have no good albums, create at least one from remaining photos
  if (albums.length === 0 && sortedPhotos.length > 0) {
    const fallbackAlbum = sortedPhotos
      .filter(p => !usedPhotos.has(p.id))
      .slice(0, maxPhotos)
    
    if (fallbackAlbum.length > 0) {
      albums.push(fallbackAlbum)
    }
  }

  return albums
}

/**
 * Calculate overall score for a cluster/album
 */
function calculateClusterScore(cluster: CuratedPhoto[], maxPhotos: number): number {
  if (cluster.length === 0) return 0

  // Average score of photos in cluster
  const avgScore = cluster.reduce((sum, p) => sum + (p.score || 0), 0) / cluster.length

  // Strong bonus for cluster size - heavily penalize small clusters
  // Prefer clusters that are close to maxPhotos
  const sizeRatio = cluster.length / Math.max(1, maxPhotos)
  const sizeBonus = sizeRatio * 100 // Max 100 points for full-size clusters
  
  // Penalty for very small clusters (less than 50% of maxPhotos)
  const sizePenalty = cluster.length < Math.ceil(maxPhotos * 0.5) ? -50 : 0

  // Bonus for color harmony (lower variance in colors = better harmony)
  let colorHarmony = 0
  if (cluster.length > 1) {
    const colors = cluster.filter(p => p.baseColor).map(p => p.baseColor!)
    const avgColor: [number, number, number] = [
      colors.reduce((sum, c) => sum + c[0], 0) / colors.length,
      colors.reduce((sum, c) => sum + c[1], 0) / colors.length,
      colors.reduce((sum, c) => sum + c[2], 0) / colors.length
    ]
    
    const variance = colors.reduce((sum, c) => {
      const dist = euclideanDistance(c, avgColor)
      return sum + dist * dist
    }, 0) / colors.length
    
    // Lower variance = higher harmony score (inverse)
    colorHarmony = Math.max(0, 50 - variance * 0.5)
  }

  return avgScore + sizeBonus + sizePenalty + colorHarmony
}

/**
 * Score photo for Artistic Flow algorithm
 * Criteria: storytelling quality, role appropriateness, visual impact, people presence
 */
function scorePhotoForArtisticFlow(photo: CuratedPhoto, role: 'intro' | 'transition' | 'climax' | 'closing'): number {
  if (!photo.characteristics) return 0

  const char = photo.characteristics
  const sceneLower = char.scene?.toLowerCase() || ''
  let score = 0

  // Base score for role appropriateness (0-30 points)
  switch (role) {
    case 'intro':
      // Prefer landscapes, nature, empty spaces
      if (sceneLower.includes('coast') || sceneLower.includes('landscape') || sceneLower.includes('nature')) {
        score += 25
      } else if (char.people_count === 0) {
        score += 15
      } else {
        score += 5
      }
      break

    case 'transition':
      // Prefer scenes with moderate activity
      if (char.people_count > 0 && char.people_count <= 3) {
        score += 20
      } else if (char.people_count === 0) {
        score += 15
      } else {
        score += 10
      }
      break

    case 'climax':
      // Prefer portraits, active scenes, many people
      if (char.people_count > 5) {
        score += 30
      } else if (sceneLower.includes('portrait') || sceneLower.includes('people')) {
        score += 25
      } else if (char.people_count > 0) {
        score += 20
      } else {
        score += 5
      }
      break

    case 'closing':
      // Prefer night scenes, sunsets, peaceful endings
      if (sceneLower.includes('night') || sceneLower.includes('sunset') || sceneLower.includes('dusk')) {
        score += 30
      } else if (char.people_count === 0 && (sceneLower.includes('landscape') || sceneLower.includes('nature'))) {
        score += 20
      } else if (char.people_count === 0) {
        score += 15
      } else {
        score += 5
      }
      break
  }

  // People presence quality (0-25 points)
  if (char.people_count > 0) {
    // More people = higher score, but cap at reasonable number
    score += Math.min(char.people_count * 3, 20)
    // Bonus for portrait scenes
    if (sceneLower.includes('portrait')) score += 5
  } else {
    // Empty scenes can be good for intro/closing
    if (role === 'intro' || role === 'closing') {
      score += 15
    } else {
      score += 10
    }
  }

  // Scene quality indicators (0-20 points)
  if (sceneLower.includes('portrait')) score += 10
  if (sceneLower.includes('landscape') || sceneLower.includes('nature')) score += 8
  if (sceneLower.includes('coast') || sceneLower.includes('beach')) score += 7
  if (sceneLower.includes('night') || sceneLower.includes('sunset')) score += 6
  if (sceneLower.includes('indoor') || sceneLower.includes('subway') || sceneLower.includes('escalator')) score += 5

  // Description quality (0-15 points)
  if (char.description) {
    const descLength = char.description.length
    if (descLength > 100) {
      score += 15
    } else if (descLength > 50) {
      score += 10
    } else {
      score += 5
    }
  }

  // Color diversity bonus (0-10 points)
  if (char.dominant_colors && char.dominant_colors.length >= 3) {
    score += 10
  } else if (char.dominant_colors && char.dominant_colors.length >= 2) {
    score += 5
  }

  return Math.round(score * 10) / 10 // Round to 1 decimal
}

/**
 * Artistic Flow Algorithm
 * Clusters all photos into groups of maxPhotos size based on storytelling flow and role similarity
 * Returns all clusters as separate albums with cohesive narrative sequences
 */
export function curateByArtisticFlow(
  photos: (Photo & { data?: any })[],
  maxPhotos: number = 50
): Photo[][] {
  // Extract characteristics and assign roles
  const enhancedPhotos: CuratedPhoto[] = photos.map(photo => {
    const char = extractCharacteristicsFromPhoto(photo)
    if (!char) {
      return { ...photo, role: 'transition' as const, score: 0 }
    }

    // Assign storytelling role
    let role: 'intro' | 'transition' | 'climax' | 'closing' = 'transition'
    const sceneLower = char.scene?.toLowerCase() || ''
    
    if (char.people_count === 0) {
      if (sceneLower.includes('coast') || sceneLower.includes('landscape') || sceneLower.includes('nature')) {
        role = 'intro'
      } else if (sceneLower.includes('night') || sceneLower.includes('sunset') || sceneLower.includes('dusk')) {
        role = 'closing'
      } else {
        role = 'transition'
      }
    } else {
      if (char.people_count > 5 || sceneLower.includes('portrait') || sceneLower.includes('people')) {
        role = 'climax'
      } else {
        role = 'transition'
      }
    }

    return {
      ...photo,
      role,
      score: 0, // Will be calculated below
      characteristics: char
    }
  })

  // Score all photos for their assigned roles
  enhancedPhotos.forEach(photo => {
    if (photo.role) {
      photo.score = scorePhotoForArtisticFlow(photo, photo.role)
    }
  })

  // Cluster photos into album-sized groups based on role similarity and narrative flow
  const albumClusters = clusterIntoArtisticAlbums(enhancedPhotos, maxPhotos)

  if (albumClusters.length === 0) {
    return [photos.slice(0, maxPhotos)]
  }

  // Score each album cluster and sort by score
  const scoredAlbums = albumClusters.map(cluster => ({
    cluster,
    score: calculateArtisticClusterScore(cluster)
  })).sort((a, b) => b.score - a.score)

  // Return all clusters as separate albums
  return scoredAlbums.map(({ cluster }) => 
    cluster.map(p => {
      const { baseColor, score, role, characteristics, ...photo } = p
      return photo
    })
  )
}

/**
 * Cluster photos into album-sized groups based on storytelling roles and narrative flow
 */
function clusterIntoArtisticAlbums(
  photos: CuratedPhoto[],
  maxPhotos: number
): CuratedPhoto[][] {
  const albums: CuratedPhoto[][] = []
  const usedPhotos = new Set<string>()

  // Sort photos by score (descending) to prioritize better photos
  const sortedPhotos = [...photos].sort((a, b) => (b.score || 0) - (a.score || 0))

  for (const seedPhoto of sortedPhotos) {
    if (usedPhotos.has(seedPhoto.id)) continue
    if (!seedPhoto.role) continue

    // Start a new album cluster with this seed photo
    const album: CuratedPhoto[] = [seedPhoto]
    usedPhotos.add(seedPhoto.id)

    // Target role distribution for a good narrative flow
    const roleTargets = {
      intro: Math.ceil(maxPhotos * 0.2),
      transition: Math.ceil(maxPhotos * 0.3),
      climax: Math.ceil(maxPhotos * 0.3),
      closing: Math.ceil(maxPhotos * 0.2)
    }

    const roleCounts = {
      intro: seedPhoto.role === 'intro' ? 1 : 0,
      transition: seedPhoto.role === 'transition' ? 1 : 0,
      climax: seedPhoto.role === 'climax' ? 1 : 0,
      closing: seedPhoto.role === 'closing' ? 1 : 0
    }

    // Fill the album with photos that maintain good role distribution
    for (const candidate of sortedPhotos) {
      if (album.length >= maxPhotos) break
      if (usedPhotos.has(candidate.id)) continue
      if (!candidate.role) continue

      // Check if adding this photo would improve role distribution
      const candidateRole = candidate.role
      const currentCount = roleCounts[candidateRole]
      const targetCount = roleTargets[candidateRole]

      // Prefer photos that help achieve target role distribution
      if (currentCount < targetCount) {
        album.push(candidate)
        usedPhotos.add(candidate.id)
        roleCounts[candidateRole]++
      } else if (album.length < maxPhotos * 0.8) {
        // Still allow some flexibility if we're not at target yet
        album.push(candidate)
        usedPhotos.add(candidate.id)
        roleCounts[candidateRole]++
      }
    }

    // Only add albums that have a reasonable size
    if (album.length >= Math.min(5, maxPhotos * 0.3)) {
      albums.push(album)
    }
  }

  return albums
}

/**
 * Calculate overall score for an artistic cluster/album
 */
function calculateArtisticClusterScore(cluster: CuratedPhoto[]): number {
  if (cluster.length === 0) return 0

  // Average score of photos in cluster
  const avgScore = cluster.reduce((sum, p) => sum + (p.score || 0), 0) / cluster.length

  // Bonus for cluster size (prefer clusters closer to maxPhotos)
  const sizeBonus = cluster.length * 0.5

  // Bonus for good role distribution (narrative flow)
  const roleCounts = {
    intro: 0,
    transition: 0,
    climax: 0,
    closing: 0
  }

  cluster.forEach(p => {
    if (p.role) roleCounts[p.role]++
  })

  const total = cluster.length
  const roleDistribution = {
    intro: roleCounts.intro / total,
    transition: roleCounts.transition / total,
    climax: roleCounts.climax / total,
    closing: roleCounts.closing / total
  }

  // Ideal distribution
  const idealDistribution = {
    intro: 0.2,
    transition: 0.3,
    climax: 0.3,
    closing: 0.2
  }

  // Calculate how close we are to ideal distribution
  let distributionScore = 0
  Object.keys(idealDistribution).forEach(role => {
    const ideal = idealDistribution[role as keyof typeof idealDistribution]
    const actual = roleDistribution[role as keyof typeof roleDistribution]
    const diff = Math.abs(ideal - actual)
    distributionScore += (1 - diff) * 30 // Max 30 points per role
  })

  return avgScore + sizeBonus + distributionScore
}

/**
 * Cluster images by color similarity using Euclidean distance
 */
function clusterByColor(
  photos: CuratedPhoto[],
  threshold: number
): CuratedPhoto[][] {
  const clusters: CuratedPhoto[][] = []

  photos.forEach(photo => {
    if (!photo.baseColor) return

    let assigned = false
    for (const cluster of clusters) {
      const ref = cluster[0]
      if (!ref.baseColor) continue

      const dist = euclideanDistance(photo.baseColor, ref.baseColor)
      if (dist < threshold) {
        cluster.push(photo)
        assigned = true
        break
      }
    }

    if (!assigned) {
      clusters.push([photo])
    }
  })

  return clusters
}

/**
 * Euclidean distance between two RGB vectors
 */
function euclideanDistance(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt(
    Math.pow(a[0] - b[0], 2) +
    Math.pow(a[1] - b[1], 2) +
    Math.pow(a[2] - b[2], 2)
  )
}

/**
 * Role order for storytelling sequencing
 */
function roleOrder(role: 'intro' | 'transition' | 'climax' | 'closing'): number {
  const order = { intro: 0, transition: 1, climax: 2, closing: 3 }
  return order[role] ?? 1
}

