# DecoVerse Frontend

AI-powered interior design platform built with React, Vite, Three.js, and Supabase.

## Tech Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS + shadcn/ui
- Three.js + React Three Fiber
- Zustand (State Management)
- Supabase (Database)
- React Router
- Vitest + Testing Library
- ESLint + Prettier + Husky + Commitlint

## Prerequisites

- Node.js 20.19+ or 22.12+
- npm 10+
- Git

## Getting Started

### 1. Clone repository

```bash
git clone https://github.com/your-username/decoverse-frontend.git
cd decoverse-frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Copy the example env file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_API_URL=http://localhost:3000
```

### 4. Run development server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## Available Commands

### Development

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Code Quality

```bash
npm run lint         # Check code with ESLint
npm run lint:fix     # Auto-fix ESLint errors
npm run format       # Format code with Prettier
```

### Testing

```bash
npm test             # Run tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Generate coverage report
```

### Docker

```bash
# Build and run with Docker
docker build -t decoverse-frontend .
docker run -p 3001:80 decoverse-frontend

# Or use docker-compose
docker-compose up --build
```

## Project Structure

```
src/
├── app/
├── components/
│   ├── common/         # Shared components
│   ├── three/          # 3D components
│   └── ui/             # shadcn/ui components
├── features/           # Feature modules (design, project, boq)
├── hooks/              # Custom React hooks
├── lib/                # Libraries & configurations
├── services/           # API services
├── store/              # State management (Zustand)
├── types/              # TypeScript types
└── utils/              # Utility functions
```

## Commit Convention

Follow Conventional Commits format:

```
feat: add new feature
fix: resolve bug
docs: update documentation
style: format code
refactor: restructure code
test: add tests
chore: update dependencies
```

Example:

```bash
git commit -m "feat: add 3D room preview component"
git commit -m "fix: resolve login error"
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feat/your-feature`
3. Commit changes: `git commit -m "feat: add your feature"`
4. Push to branch: `git push origin feat/your-feature`
5. Open a Pull Request

## Troubleshooting

### Port already in use

If port 5173 is already in use, kill the process or change port in `vite.config.ts`.
