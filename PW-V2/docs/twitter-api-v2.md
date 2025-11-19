# Twitter API V2 - Node.js Client

## Library: twitter-api-v2

Official documentation: https://github.com/plhery/node-twitter-api-v2

## Installation

```bash
npm install twitter-api-v2
# or
yarn add twitter-api-v2
```

## Authentication

### OAuth 1.0a (User Context)

```typescript
import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi({
  appKey: 'YOUR_APP_KEY',
  appSecret: 'YOUR_APP_SECRET',
  accessToken: 'USER_ACCESS_TOKEN',
  accessSecret: 'USER_ACCESS_SECRET',
});
```

### OAuth 2.0 Bearer Token

```typescript
const client = new TwitterApi('YOUR_BEARER_TOKEN');
```

## Fetching User Timeline

### V2 API - User Timeline (Recommended)

```typescript
// Fetch tweets from specific user by user ID
const userTimeline = await client.v2.userTimeline('USER_ID', {
  'tweet.fields': ['created_at', 'public_metrics'],
  'user.fields': ['username', 'verified'],
  expansions: ['author_id'],
  max_results: 100,  // Max 100 per request
  exclude: ['retweets', 'replies']  // Optional: only original tweets
});

// Iterate through tweets
for await (const tweet of userTimeline) {
  console.log(tweet.text);
  console.log(tweet.created_at);
  console.log(tweet.public_metrics); // likes, retweets, etc.
}
```

### V2 API - With Media and Poll Data

```typescript
const timeline = await client.v2.userTimeline('USER_ID', {
  expansions: ['attachments.media_keys', 'attachments.poll_ids', 'referenced_tweets.id'],
  'media.fields': ['url'],
  max_results: 100
});

for await (const tweet of timeline) {
  const medias = timeline.includes.medias(tweet);
  const poll = timeline.includes.poll(tweet);

  if (medias.length) {
    console.log('Media URLs:', medias.map(m => m.url));
  }
  if (poll) {
    console.log('Poll options:', poll.options.map(opt => opt.label));
  }
}
```

### V1 API - Legacy (Still Supported)

```typescript
// By user ID
const userTimeline = await client.v1.userTimeline('USER_ID', {
  include_entities: true,
  tweet_mode: 'extended'
});

const tweets = userTimeline.tweets;

// By username
const userTimeline = await client.v1.userTimelineByUsername('username');
```

## Home Timeline (Authenticated User)

Requires OAuth 1.0a authentication.

```typescript
const homeTimeline = await client.v2.homeTimeline({
  'tweet.fields': ['created_at', 'public_metrics'],
  'user.fields': ['username', 'verified'],
  expansions: ['author_id'],
  max_results: 100,
});

for await (const tweet of homeTimeline) {
  console.log(tweet.text);
}
```

## Mention Timeline

```typescript
const mentions = await client.v2.userMentionTimeline('USER_ID', {
  'tweet.fields': ['created_at'],
  max_results: 100
});

for await (const mention of mentions) {
  console.log(`Mentioned in: ${mention.text}`);
}
```

## Pagination

All timeline methods return paginators that support async iteration:

```typescript
const timeline = await client.v2.userTimeline('USER_ID', {
  max_results: 100
});

// Fetch next page
if (!timeline.done) {
  await timeline.fetchNext();
}

// Iterate through all pages (respects rate limits)
for await (const tweet of timeline) {
  console.log(tweet.text);
}
```

## Tweet Fields

### Available Tweet Fields

```typescript
{
  'tweet.fields': [
    'created_at',
    'public_metrics',    // likes, retweets, replies, quotes
    'author_id',
    'conversation_id',
    'in_reply_to_user_id',
    'referenced_tweets',
    'attachments',
    'entities',          // hashtags, mentions, urls
    'lang'
  ]
}
```

### Public Metrics Structure

```typescript
{
  retweet_count: number,
  reply_count: number,
  like_count: number,
  quote_count: number,
  bookmark_count: number,
  impression_count: number
}
```

### User Fields

```typescript
{
  'user.fields': [
    'username',
    'name',
    'verified',
    'description',
    'profile_image_url',
    'public_metrics'     // followers, following, tweet count
  ]
}
```

## Complete Example: Fetch User Tweets with Engagement

```typescript
import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function fetchUserTweets(userId: string, count: number = 100) {
  const tweets = [];

  const timeline = await client.v2.userTimeline(userId, {
    'tweet.fields': ['created_at', 'public_metrics', 'entities'],
    'user.fields': ['username'],
    max_results: Math.min(count, 100),
    exclude: ['retweets', 'replies']
  });

  for await (const tweet of timeline) {
    tweets.push({
      id: tweet.id,
      text: tweet.text,
      created_at: tweet.created_at,
      likes: tweet.public_metrics?.like_count || 0,
      retweets: tweet.public_metrics?.retweet_count || 0,
      replies: tweet.public_metrics?.reply_count || 0,
      hashtags: tweet.entities?.hashtags?.map(h => h.tag) || [],
      mentions: tweet.entities?.mentions?.map(m => m.username) || []
    });

    if (tweets.length >= count) break;
  }

  return tweets;
}

// Usage
const tweets = await fetchUserTweets('123456789', 200);
console.log(`Fetched ${tweets.length} tweets`);
```

## Rate Limits

### V2 API Limits

- **User Timeline**: 1500 requests per 15 minutes (per user)
- **Home Timeline**: 180 requests per 15 minutes (per user)
- **Max Results per Request**: 100 tweets

### Handling Rate Limits

The library automatically handles rate limits when using async iteration:

```typescript
for await (const tweet of timeline) {
  // Automatically waits if rate limit is hit
  console.log(tweet.text);
}
```

## Error Handling

```typescript
try {
  const timeline = await client.v2.userTimeline('USER_ID');
} catch (error) {
  if (error.code === 429) {
    console.error('Rate limit exceeded');
  } else if (error.code === 401) {
    console.error('Authentication failed');
  } else {
    console.error('API Error:', error.message);
  }
}
```

## TypeScript Types

```typescript
import {
  TweetV2,
  UserV2,
  TweetUserTimelineV2Paginator,
  TwitterApi
} from 'twitter-api-v2';

const timeline: TweetUserTimelineV2Paginator = await client.v2.userTimeline('USER_ID');

for await (const tweet: TweetV2 of timeline) {
  console.log(tweet.text);
}
```

## Best Practices

1. **Use V2 API**: Preferred over V1 for new projects
2. **Batch Requests**: Fetch max_results=100 per request for efficiency
3. **Filter Early**: Use `exclude` parameter to filter retweets/replies
4. **Cache Results**: Store tweets to avoid repeated API calls
5. **Handle Rate Limits**: Use async iteration or implement backoff
6. **Minimal Fields**: Request only needed fields to reduce response size

## Integration with Embeddings

```typescript
async function collectTweetsForEmbedding(userId: string) {
  const timeline = await client.v2.userTimeline(userId, {
    'tweet.fields': ['created_at', 'public_metrics'],
    max_results: 100,
    exclude: ['retweets', 'replies']
  });

  const tweets = [];
  for await (const tweet of timeline) {
    tweets.push({
      id: tweet.id,
      text: tweet.text,
      created_at: tweet.created_at,
      engagement_score: (
        (tweet.public_metrics?.like_count || 0) +
        (tweet.public_metrics?.retweet_count || 0) * 2
      )
    });
  }

  return tweets;
}
```

## Source

Documentation extracted from: https://github.com/plhery/node-twitter-api-v2
