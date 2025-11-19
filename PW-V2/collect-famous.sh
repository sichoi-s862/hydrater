#!/bin/bash

# 유명인 트윗 수집 스크립트

echo "🎯 유명인 트윗 수집기"
echo ""
echo "1. Paul Graham (YC)"
echo "2. Naval Ravikant"
echo "3. DHH (Ruby on Rails)"
echo "4. Pieter Levels"
echo "5. Custom (직접 입력)"
echo ""
read -p "선택 (1-5): " choice

case $choice in
  1)
    NAME="paul_graham"
    TWEETS='[
      "Startups are like mosquitoes. You need a huge number before you get a good one.",
      "The way to get startup ideas is not to try to think of startup ideas.",
      "Do things that don'\''t scale.",
      "Make something people want.",
      "If you'\''re not embarrassed by the first version of your product, you'\''ve launched too late."
    ]'
    ;;
  2)
    NAME="naval"
    TWEETS='[
      "Seek wealth, not money or status.",
      "Play long-term games with long-term people.",
      "Learn to sell. Learn to build. If you do both, you will be unstoppable.",
      "The most important skill for getting rich is becoming a perpetual learner.",
      "Code and media are permissionless leverage."
    ]'
    ;;
  3)
    NAME="dhh"
    TWEETS='[
      "Convention over configuration.",
      "Optimize for programmer happiness.",
      "You don'\''t need permission to start.",
      "Calm is the new productivity.",
      "It doesn'\''t have to be crazy at work."
    ]'
    ;;
  4)
    NAME="levelsio"
    TWEETS='[
      "Just ship it.",
      "Build in public.",
      "12 startups in 12 months.",
      "Make $1 first, then scale.",
      "Location independence is freedom."
    ]'
    ;;
  5)
    read -p "User ID: " NAME
    read -p "트윗 1: " T1
    read -p "트윗 2: " T2
    read -p "트윗 3: " T3
    read -p "트윗 4: " T4
    read -p "트윗 5: " T5
    TWEETS="[\"$T1\",\"$T2\",\"$T3\",\"$T4\",\"$T5\"]"
    ;;
esac

echo ""
echo "📝 수집 중: $NAME"
echo ""

curl -X POST http://localhost:3001/api/manual/add-tweets \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$NAME\",\"tweets\":$TWEETS}"

echo ""
echo ""
echo "✅ 완료!"
echo ""
echo "이제 드래프트 생성:"
echo "curl -X POST http://localhost:3001/api/drafts/generate \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"user_id\":\"$NAME\",\"idea\":\"Your idea here\"}'"
