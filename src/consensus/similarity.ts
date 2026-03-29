/**
 * Similarity calculation module with pluggable algorithms
 * Supports: Jaccard, TF-IDF, and Hybrid approaches
 */

export type SimilarityAlgorithm = 'jaccard' | 'tfidf' | 'hybrid';

// Simple stop words for English
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for',
  'from', 'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on',
  'that', 'the', 'to', 'was', 'will', 'with', 'the',
]);

// Simple stemming - remove common suffixes
function stem(word: string): string {
  // Remove common suffixes with length checks to avoid over-stemming
  if (word.length > 4 && word.endsWith('ing')) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith('ed')) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s')) return word.slice(0, -1);
  return word;
}

// Normalize and tokenize text
function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
    .map(stem);
}

// Jaccard similarity (set-based)
export function jaccardSimilarity(text1: string, text2: string): number {
  const words1 = new Set(normalize(text1));
  const words2 = new Set(normalize(text2));

  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  // Handle edge case: both texts empty
  if (union.size === 0) return 1.0;

  return intersection.size / union.size;
}

// TF-IDF cosine similarity
export function tfidfSimilarity(
  text1: string,
  text2: string,
  corpus?: string[]
): number {
  const tokens1 = normalize(text1);
  const tokens2 = normalize(text2);

  if (tokens1.length === 0 && tokens2.length === 0) return 1.0;
  if (tokens1.length === 0 || tokens2.length === 0) return 0.0;

  // Build vocabulary
  const vocab = new Set([...tokens1, ...tokens2]);

  // Calculate term frequencies
  const tf1 = calculateTF(tokens1);
  const tf2 = calculateTF(tokens2);

  // Calculate IDF (inverse document frequency)
  const idf = calculateIDF(vocab, corpus || [text1, text2]);

  // Build TF-IDF vectors
  const vector1 = buildTFIDFVector(tf1, idf, vocab);
  const vector2 = buildTFIDFVector(tf2, idf, vocab);

  // Calculate cosine similarity
  return cosineSimilarity(vector1, vector2);
}

function calculateTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();

  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }

  // Normalize by document length
  for (const [term, count] of tf.entries()) {
    tf.set(term, count / tokens.length);
  }

  return tf;
}

function calculateIDF(vocab: Set<string>, corpus: string[]): Map<string, number> {
  const idf = new Map<string, number>();
  const totalDocs = corpus.length;

  for (const term of vocab) {
    let docsWithTerm = 0;

    for (const doc of corpus) {
      if (doc.toLowerCase().includes(term)) {
        docsWithTerm++;
      }
    }

    // IDF = log(N / (1 + df))
    // Add 1 to avoid division by zero
    idf.set(term, Math.log(totalDocs / (1 + docsWithTerm)));
  }

  return idf;
}

function buildTFIDFVector(
  tf: Map<string, number>,
  idf: Map<string, number>,
  vocab: Set<string>
): number[] {
  const vector: number[] = [];

  for (const term of vocab) {
    const tfValue = tf.get(term) || 0;
    const idfValue = idf.get(term) || 0;
    vector.push(tfValue * idfValue);
  }

  return vector;
}

function cosineSimilarity(vector1: number[], vector2: number[]): number {
  if (vector1.length !== vector2.length) return 0;

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < vector1.length; i++) {
    dotProduct += vector1[i] * vector2[i];
    magnitude1 += vector1[i] * vector1[i];
    magnitude2 += vector2[i] * vector2[i];
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  return dotProduct / (magnitude1 * magnitude2);
}

// Hybrid: Jaccard fast-path (>0.85) then TF-IDF
export function hybridSimilarity(
  text1: string,
  text2: string,
  corpus?: string[]
): number {
  // Fast path: if Jaccard similarity is high, return it
  const jaccardScore = jaccardSimilarity(text1, text2);

  if (jaccardScore > 0.85) {
    return jaccardScore;
  }

  // Otherwise, use more sophisticated TF-IDF
  return tfidfSimilarity(text1, text2, corpus);
}

// Main similarity function with algorithm selection
export function calculateSimilarity(
  text1: string,
  text2: string,
  algorithm: SimilarityAlgorithm = 'hybrid',
  corpus?: string[]
): number {
  switch (algorithm) {
    case 'jaccard':
      return jaccardSimilarity(text1, text2);
    case 'tfidf':
      return tfidfSimilarity(text1, text2, corpus);
    case 'hybrid':
      return hybridSimilarity(text1, text2, corpus);
    default:
      return jaccardSimilarity(text1, text2);
  }
}
