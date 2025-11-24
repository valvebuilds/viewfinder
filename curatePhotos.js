import chroma from "chroma-js"; // npm install chroma-js

/**
 * Parse JSON and generate curated albums.
 * @param {Object} data - JSON from Vision API
 * @returns {Object[]} albums
 */
export function curatePhotos(data) {
  const images = data.images.map(img => {
    // Convert first dominant color to RGB for clustering
    const baseColor = chroma(img.dominant_colors[0] || "#000").rgb();

    // Heuristic score calculation
    let score = 0;
    if (img.people_count > 0) score += 3;
    if (img.scene?.includes("portrait")) score += 2;
    if (img.scene?.includes("night")) score -= 1;

    // Simple storytelling role
    let role = "transition";
    if (img.people_count === 0 && img.scene?.includes("coast")) role = "intro";
    else if (img.people_count > 5) role = "climax";
    else if (img.scene?.includes("portrait")) role = "climax";
    else if (img.scene?.includes("night")) role = "ending";

    return {
      ...img,
      baseColor,
      score,
      role,
    };
  });

  // --- Clustering by dominant color ---
  const clusters = clusterByColor(images, 80); // 80 = color distance threshold

  // --- Sort each cluster by storytelling role ---
  const albums = clusters.map(cluster => {
    const sorted = cluster.sort((a, b) => roleOrder(a.role) - roleOrder(b.role) || b.score - a.score);
    return {
      album_id: `album_${Math.random().toString(36).slice(2, 8)}`,
      images: sorted,
    };
  });

  return albums;
}

/**
 * Cluster images by color similarity.
 * @param {Array} images
 * @param {number} threshold
 * @returns {Array[]} clusters
 */
function clusterByColor(images, threshold) {
  const clusters = [];
  images.forEach(img => {
    let assigned = false;
    for (const cluster of clusters) {
      const ref = cluster[0].baseColor;
      const dist = euclideanDistance(img.baseColor, ref);
      if (dist < threshold) {
        cluster.push(img);
        assigned = true;
        break;
      }
    }
    if (!assigned) clusters.push([img]);
  });
  return clusters;
}

/**
 * Role order for storytelling sequencing
 */
function roleOrder(role) {
  const order = { intro: 0, transition: 1, climax: 2, ending: 3 };
  return order[role] ?? 1;
}

/**
 * Euclidean distance between two RGB vectors
 */
function euclideanDistance(a, b) {
  return Math.sqrt(
    Math.pow(a[0] - b[0], 2) +
    Math.pow(a[1] - b[1], 2) +
    Math.pow(a[2] - b[2], 2)
  );
}
