# Hydrater Frontend

Modern React + TypeScript frontend for the Hydrater platform.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **CSS Modules** - Scoped styling

## Project Structure

```
client/
├── src/
│   ├── components/      # React components
│   │   ├── Auth/        # Authentication components
│   │   ├── Common/      # Shared components
│   │   ├── Draft/       # Draft management components
│   │   └── Profile/     # User profile components
│   ├── context/         # React context providers
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   ├── services/        # API service layer
│   ├── styles/          # Component styles
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Main app component
│   └── main.tsx         # App entry point
├── public/              # Static assets
└── dist/                # Build output (generated)
```

## Development

### Prerequisites

- Node.js 18+ and npm
- Backend server running on port 3000

### Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:5173 in your browser

The dev server includes:
- Hot Module Replacement (HMR) for instant updates
- API proxy to backend server (port 3000)
- TypeScript type checking

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Integration

The frontend communicates with the backend through the API service layer in `src/services/api.ts`:

- **Authentication**: `/auth/*` endpoints
- **User Profile**: `/api/user/*` endpoints
- **Drafts**: `/api/drafts/*` endpoints
- **Content Operations**: `/api/drafts/analyze`, `/api/drafts/crawl`

In development, Vite proxies these requests to `http://localhost:3000`.

## Building for Production

1. Build the frontend:
   ```bash
   npm run build
   ```

2. The output will be in the `dist/` directory

3. The backend server will serve these files when `NODE_ENV=production`

## Key Features

### Authentication
- X (Twitter) OAuth flow
- Protected routes
- Auth context for global state

### User Profile Management
- Editable user preferences
- Form validation
- Auto-save functionality

### Draft Management
- Generate, edit, and publish drafts
- Filter by status (generated, edited, published)
- Real-time updates
- Inline editing

### Content Operations
- Analyze posting style
- Crawl latest news
- Generate drafts with AI

## TypeScript Types

All API data structures are defined in `src/types/index.ts`:
- `User` - User account information
- `UserProfile` - User preferences and settings
- `Draft` - Draft post data
- `DraftStatus` - Draft lifecycle state
- And more...

## Contributing

When adding new features:

1. Create components in the appropriate directory
2. Add TypeScript types for all data structures
3. Create corresponding CSS files for styling
4. Update API service layer if needed
5. Test in both development and production mode
