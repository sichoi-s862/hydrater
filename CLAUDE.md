# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hydrater is an X (Twitter) content automation platform that helps users generate and publish posts aligned with their interests and brand voice. The system analyzes user preferences, crawls relevant content, and generates draft posts using AI.

## Core Architecture

### Authentication & User Management
- **X OAuth Flow**: Only authentication method. Stores user tokens securely for API access.
- **User Profile**: Captures interests, brand direction, author style, and other preferences used throughout the content generation pipeline.

### Content Pipeline Flow

1. **Tendency Analysis**
   - Analyzes user-defined preferences (interests, brand direction, author style)
   - Examines past X posts from the user's account to understand posting patterns and voice
   - Builds a comprehensive user profile for content personalization

2. **Content Crawling**
   - Discovers news and trending issues matching user interests
   - Filters content based on the analyzed user tendency
   - Maintains freshness and relevance of source material

3. **Draft Generation**
   - Uses OpenAI API to generate multiple post drafts
   - Incorporates user tendency analysis and crawled content
   - Applies brand direction and author style to maintain consistency

4. **Review & Publishing**
   - Users review AI-generated drafts
   - Supports editing before publication
   - One-click posting to X via API

## Key Integration Points

### X (Twitter) API
- OAuth 2.0 authentication and token management
- Reading user's post history for tendency analysis
- Publishing posts to user's timeline
- Handle rate limits and API versioning

### OpenAI API
- Prompt engineering for post generation
- Context window management for user profile and source content
- Handle multiple draft variations
- Cost optimization and error handling

## Data Flow Architecture

The system follows a unidirectional data flow:
```
User Login (X OAuth) → Profile Setup → [Tendency Analysis] →
Content Crawling → Draft Generation (OpenAI) → Draft Review → Publish (X API)
```

**Tendency Analysis** is the core differentiator that personalizes content by:
- Mining user's explicit preferences
- Analyzing historical post patterns
- Creating a unified user voice model

## Development Considerations

### API Credentials
Both X API credentials and OpenAI API keys must be configured. These should be stored securely and never committed to the repository.

### State Management
The draft lifecycle (generated → reviewed → edited → published) requires careful state tracking. Consider the workflow between draft creation and final publication.

### Content Storage
User profiles, tendency analysis results, crawled content, and draft posts need persistent storage with appropriate indexing for efficient retrieval.

### Async Processing
Content crawling and draft generation are computationally expensive operations that should run asynchronously to avoid blocking the user interface.
