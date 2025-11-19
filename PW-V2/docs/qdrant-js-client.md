# Qdrant JavaScript Client Documentation

## Installation

```bash
npm install @qdrant/js-client-rest
# or
yarn add @qdrant/js-client-rest
# or
pnpm i @qdrant/js-client-rest
```

## Setup

### Run Qdrant Docker Container

```bash
docker run -p 6334:6334 qdrant/qdrant
```

### Instantiate Client

```typescript
import {QdrantClient} from '@qdrant/js-client-rest';

const client = new QdrantClient({host: '127.0.0.1', port: 6333});
// or
const client = new QdrantClient({url: 'http://127.0.0.1:6333'});
```

## API Methods

### QdrantClient Constructor

```typescript
QdrantClient(options: ClientOptions)
```

**Options:**
- `host?: string` - Qdrant server host
- `port?: number` - Qdrant server port
- `url?: string` - Full URL to Qdrant server
- `apiKey?: string` - API key for authentication
- `timeout?: number` - Request timeout in milliseconds

### Collection Operations

```typescript
// Get all collections
getCollections(): Promise<CollectionsResponse>

// Get specific collection
getCollection(collectionName: string): Promise<CollectionInfo>
```

### Direct API Access

```typescript
// Access specific API modules
api(module: string): ApiModule

// Example
await client.api('collections').getCollections();
```

## Error Handling

Errors are typed and can be handled using discriminated unions:

```typescript
try {
    const collection = await client.getCollection('my-collection');
} catch (e) {
    if (e instanceof client.getCollection.Error) {
        const error = e.getActualType(); // { status: number, data: any }

        if (error.status === 400) {
            console.error('Bad request:', error.data.status.error);
        } else if (error.status === 500) {
            console.error('Server error:', error.data.status.error);
        }
    }
}
```

## Basic Usage Example

```typescript
try {
    const result = await client.getCollections();
    console.log('List of collections:', result.collections);
} catch (err) {
    console.error('Could not get collections:', err);
}
```

## Source

Documentation extracted from: https://github.com/qdrant/qdrant-js
