# Qdrant Vector Operations

## Collection Creation

### TypeScript/JavaScript

```typescript
await client.createCollection("test_collection", {
  vectors: { size: 4, distance: "Dot" },
});
```

### With Cosine Distance (Recommended for Text Embeddings)

```typescript
import { QdrantClient } from '@qdrant/js-client-rest';

const client = new QdrantClient({ url: 'http://localhost:6333' });

await client.createCollection("user_tweets", {
  vectors: {
    size: 1536, // OpenAI text-embedding-3-small size
    distance: "Cosine"
  }
});
```

### Python Example

```python
from qdrant_client.models import Distance, VectorParams

client.create_collection(
    collection_name="user_tweets",
    vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
)
```

## Vector Search

### TypeScript Query

```typescript
const searchResult = await client.query("user_tweets", {
  query: [0.2, 0.1, 0.9, 0.7], // Query vector
  limit: 5,
  with_payload: true
});

console.log(searchResult.points);
```

### Python Query

```python
search_result = client.query_points(
    collection_name="user_tweets",
    query=[0.2, 0.1, 0.9, 0.7],
    with_payload=True,
    limit=5
).points

print(search_result)
```

## Distance Metrics

- **Cosine**: Best for text embeddings (measures angle between vectors)
- **Dot**: Fast but requires normalized vectors
- **Euclidean**: Measures actual distance between points

## Collection Configuration

### Basic Structure

```typescript
{
  vectors: {
    size: number,        // Embedding dimension (e.g., 1536 for OpenAI)
    distance: string     // "Cosine" | "Dot" | "Euclidean"
  }
}
```

### Check Collection Exists

```python
if not client.collection_exists("user_tweets"):
    client.create_collection(...)
```

## Payload Schema

When inserting points with metadata:

```typescript
{
  user_id: string,
  tweet_id: string,
  text: string,
  created_at: string,
  engagement_score?: number,
  metadata?: {
    has_emoji: boolean,
    has_hashtag: boolean,
    length: number
  }
}
```

## Source

Documentation extracted from: https://qdrant.tech/documentation/
