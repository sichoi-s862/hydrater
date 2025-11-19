#!/bin/bash

echo "🔍 Qdrant 상태 확인"
echo "==================="
echo ""

# Health check
echo "1️⃣ Health Check:"
curl -s http://localhost:6333 | jq -r '.title, .version' 2>/dev/null || echo "❌ Qdrant not running"
echo ""

# Collections
echo "2️⃣ Collections:"
curl -s http://localhost:6333/collections | jq -r '.result.collections[] | "  - \(.name) (\(.points_count) points)"' 2>/dev/null || echo "❌ Cannot fetch collections"
echo ""

# user_tweets details
echo "3️⃣ user_tweets 상세:"
if curl -s http://localhost:6333/collections/user_tweets > /dev/null 2>&1; then
  POINTS=$(curl -s http://localhost:6333/collections/user_tweets | jq '.result.points_count')
  VECTORS=$(curl -s http://localhost:6333/collections/user_tweets | jq '.result.vectors_count')
  echo "  📊 Points: $POINTS"
  echo "  🔢 Vectors: $VECTORS"
  echo "  📏 Dimension: 1536"
  echo "  📐 Distance: Cosine"
else
  echo "  ⚠️  Collection not created yet"
fi
echo ""

# Dashboard
echo "4️⃣ Dashboard:"
if curl -s http://localhost:6333/dashboard > /dev/null 2>&1; then
  echo "  ✅ Available at: http://localhost:6333/dashboard"
else
  echo "  ❌ Not available (upgrade to v1.3.0+)"
fi
echo ""

echo "✅ Done!"
