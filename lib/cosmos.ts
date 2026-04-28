import { CosmosClient, Container } from '@azure/cosmos'

let client: CosmosClient | null = null

function getClient(): CosmosClient {
  if (!client) {
    const connectionString = process.env.COSMOS_CONNECTION_STRING
    if (!connectionString) throw new Error('COSMOS_CONNECTION_STRING is not set')
    client = new CosmosClient(connectionString)
  }
  return client
}

function getDatabase() {
  const dbName = process.env.COSMOS_DATABASE || 'malim-kg'
  return getClient().database(dbName)
}

export function getContainer(name: string): Container {
  return getDatabase().container(name)
}

export const containers = {
  // Layer 0
  documents:     () => getContainer('documents'),
  chunks:        () => getContainer('chunks'),
  // Layer 1
  semanticEdges: () => getContainer('semantic_edges'),
  // Layer 2
  claims:        () => getContainer('claims'),
  datapoints:    () => getContainer('datapoints'),
  conflicts:     () => getContainer('conflicts'),
  // Layer 3
  entities:      () => getContainer('entities'),
  entityEdges:   () => getContainer('entity_edges'),
  // Layer 4
  inferences:    () => getContainer('inferences'),
  // Infrastructure
  submissions:   () => getContainer('submissions'),
  users:         () => getContainer('users'),
  indicators:    () => getContainer('indicator_registry'),
  audit:         () => getContainer('audit_log'),
}
