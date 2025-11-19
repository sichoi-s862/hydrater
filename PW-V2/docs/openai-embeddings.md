# OpenAI Embeddings API

## Overview

The OpenAI Embeddings API converts text into numerical vector representations that capture semantic meaning. These embeddings are useful for:
- Semantic search
- Clustering and categorization
- Recommendations
- Anomaly detection
- Classification

## Models

- **text-embedding-3-small**: 1536 dimensions, cost-effective
- **text-embedding-3-large**: 3072 dimensions, higher quality
- **text-embedding-ada-002**: Legacy model, 1536 dimensions

## API Endpoint

```
POST https://api.openai.com/v1/embeddings
```

## Request Format

### TypeScript/JavaScript

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function getEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.replace("\n", " "),
  });

  return response.data[0].embedding;
}

// Usage
const embedding = await getEmbedding("Your text here");
console.log(embedding.length); // 1536
```

### Python

```python
from openai import OpenAI
client = OpenAI()

def get_embedding(text, model="text-embedding-3-small"):
    text = text.replace("\n", " ")
    return client.embeddings.create(input=[text], model=model).data[0].embedding

embedding = get_embedding("Your text here")
print(len(embedding))  # 1536
```

## Request Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `input` | string or array | Yes | Text to embed (single string or array of strings) |
| `model` | string | Yes | Model ID (e.g., "text-embedding-3-small") |
| `encoding_format` | string | No | Format: "float" (default) or "base64" |
| `dimensions` | integer | No | Output dimensions (v3 models only) |
| `user` | string | No | Unique user identifier for monitoring |

## Response Format

```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "index": 0,
      "embedding": [
        0.0023064255,
        -0.009327292,
        ...
        -0.0028842222
      ]
    }
  ],
  "model": "text-embedding-3-small",
  "usage": {
    "prompt_tokens": 8,
    "total_tokens": 8
  }
}
```

## Response Structure

### Embedding Object

```typescript
{
  object: "embedding",      // Always "embedding"
  index: number,            // Position in batch
  embedding: number[]       // Vector (1536 floats for text-embedding-3-small)
}
```

### Usage Object

```typescript
{
  prompt_tokens: number,    // Input tokens used
  total_tokens: number      // Total tokens processed
}
```

## Batch Processing

```typescript
async function getEmbeddings(texts: string[]) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts.map(t => t.replace("\n", " ")),
  });

  return response.data.map(item => item.embedding);
}

// Usage
const tweets = ["First tweet", "Second tweet", "Third tweet"];
const embeddings = await getEmbeddings(tweets);
```

## Limits

- **Max input tokens**: 8,192 per request
- **Max batch size**: 2,048 inputs per request
- **Max total tokens**: 300,000 summed across all inputs in single request
- Input cannot be empty

## Error Handling

```typescript
try {
  const embedding = await getEmbedding(text);
} catch (error) {
  if (error.response) {
    console.error(`API Error: ${error.response.status}`, error.response.data);
  } else {
    console.error('Request failed:', error.message);
  }
}
```

## Best Practices

1. **Clean Input**: Remove newlines and excessive whitespace
2. **Batch Processing**: Process multiple texts in single request for efficiency
3. **Model Selection**: Use text-embedding-3-small for cost-effectiveness
4. **Normalization**: Not required (embeddings are already normalized for cosine similarity)
5. **Caching**: Cache embeddings to avoid regenerating for same text

## Cost Optimization

**text-embedding-3-small** is recommended for most use cases:
- Lower cost per token
- Fast processing
- 1536 dimensions (sufficient for semantic similarity)
- Compatible with Qdrant and other vector databases

## Integration Example

```typescript
import OpenAI from 'openai';
import { QdrantClient } from '@qdrant/js-client-rest';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const qdrant = new QdrantClient({ url: 'http://localhost:6333' });

async function storeTweetEmbedding(userId: string, tweetId: string, text: string) {
  // Generate embedding
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.replace("\n", " "),
  });

  const embedding = response.data[0].embedding;

  // Store in Qdrant
  await qdrant.upsert("user_tweets", {
    points: [{
      id: tweetId,
      vector: embedding,
      payload: {
        user_id: userId,
        tweet_id: tweetId,
        text: text,
        created_at: new Date().toISOString()
      }
    }]
  });
}
```

## Source

Documentation extracted from: https://platform.openai.com/docs/
