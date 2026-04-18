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
  users: () => getContainer('users'),
  submissions: () => getContainer('submissions'),
  indicators: () => getContainer('indicator_registry'),
  conflicts: () => getContainer('conflicts'),
  audit: () => getContainer('audit_log'),
}
