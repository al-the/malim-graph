export interface EmbeddingResult {
  embedding: number[]
  model: string
  dimensions: number
}

/**
 * Generate an embedding vector via Azure OpenAI text-embedding-3-small.
 * Returns null if the service is not configured (allows graceful degradation).
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult | null> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const deployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-small'
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-01'

  if (!endpoint || !apiKey) {
    console.warn('Azure OpenAI not configured — skipping embedding generation')
    return null
  }

  const url = `${endpoint}/openai/deployments/${deployment}/embeddings?api-version=${apiVersion}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      input: text.slice(0, 8000), // safety truncation
      dimensions: 1536,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Azure OpenAI embedding failed: ${response.status} ${err}`)
  }

  const json = await response.json() as {
    data: Array<{ embedding: number[] }>
    model: string
  }

  return {
    embedding: json.data[0].embedding,
    model: json.model || deployment,
    dimensions: json.data[0].embedding.length,
  }
}
