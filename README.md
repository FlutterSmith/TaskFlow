# TaskFlow - Modern Task Management Platform

A modern, collaborative task management platform built with Next.js 14, TypeScript, and Tailwind CSS. Compete with Asana and Monday.com with real-time collaboration, multi-tenant architecture, and subscription billing.

## 🚀 Features

### Core Features
- ✅ **Multi-tenant Architecture** - Organizations with teams and role-based access control
- ✅ **Real-time Collaboration** - Live updates across all users via Socket.io
- ✅ **Kanban Board** - Drag-and-drop task management with beautiful UI
- ✅ **Multiple Views** - Board, List, Timeline, and Calendar views
- ✅ **Task Management** - Create, assign, comment, and track tasks
- ✅ **Project Organization** - Organize tasks by projects with custom workflows
- ✅ **Authentication** - Email/password and OAuth (Google) via NextAuth.js
- ✅ **Dark Mode** - Full dark mode support with system preference detection
- ✅ **Keyboard Shortcuts** - Power user features for navigation and actions
- ✅ **PWA Support** - Install as a native app with offline capabilities
- ✅ **Responsive Design** - Mobile-first, works on all devices

### Technical Features
- ⚡ **Next.js 14 App Router** - Latest React features with Server Components
- 🎨 **Tailwind CSS** - Utility-first styling with custom design system
- 📦 **React Query** - Powerful data fetching with caching and optimistic updates
- 🗂️ **Zustand** - Lightweight state management
- 🎯 **TypeScript** - Full type safety throughout the application
- 🔄 **Optimistic UI** - Instant feedback for better UX
- ♿ **Accessibility** - WCAG 2.1 AA compliant
- 🎭 **Animations** - Smooth transitions with Framer Motion
- 🧪 **Form Validation** - Zod schemas with React Hook Form

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Backend API running (see backend setup)
- PostgreSQL database
- Redis instance

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/taskflow.git
   cd taskflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local`:
   ```env
   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-here

   # Backend API
   NEXT_PUBLIC_API_URL=http://localhost:4000
   NEXT_PUBLIC_WS_URL=http://localhost:4000

   # OAuth Providers
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
taskflow-frontend/
├── public/                 # Static files
│   ├── manifest.json      # PWA manifest
│   └── sw.js              # Service worker
├── src/
│   ├── app/               # Next.js 14 app directory
│   │   ├── (auth)/       # Auth pages (login, register)
│   │   ├── (dashboard)/  # Protected dashboard pages
│   │   ├── api/          # API routes (NextAuth)
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Landing page
│   ├── components/        # React components
│   │   ├── ui/           # Base UI components (shadcn/ui)
│   │   ├── layout/       # Layout components (Header, Sidebar)
│   │   ├── board/        # Kanban board components
│   │   ├── task/         # Task-related components
│   │   └── shared/       # Shared components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   │   ├── api-client.ts # API client with axios
│   │   ├── auth.ts       # NextAuth configuration
│   │   ├── socket.ts     # Socket.io client
│   │   └── utils.ts      # Helper functions
│   ├── stores/           # Zustand stores
│   ├── styles/           # Global styles
│   └── types/            # TypeScript type definitions
├── .eslintrc.json        # ESLint configuration
├── .prettierrc           # Prettier configuration
├── next.config.js        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command menu |
| `Cmd/Ctrl + N` | Create new task |
| `Cmd/Ctrl + B` | Toggle sidebar |
| `G then D` | Go to Dashboard |
| `G then P` | Go to Projects |
| `G then T` | Go to Tasks |
| `Esc` | Close modals |

## 🎨 Design System

TaskFlow uses a custom design system built on Tailwind CSS with:
- **Colors**: Primary (Blue), Secondary (Gray), Accent colors
- **Typography**: Inter font family
- **Components**: Consistent spacing, borders, and shadows
- **Dark Mode**: Automatic theme switching

## 📱 PWA Features

TaskFlow can be installed as a Progressive Web App:
- **Offline Support**: Service worker caches pages for offline access
- **Install Prompt**: Native install experience on mobile and desktop
- **App Shortcuts**: Quick access to Dashboard and Projects
- **Splash Screen**: Native app-like launch experience

## 🔧 Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format with Prettier
npm run type-check       # TypeScript type checking
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Automatic deployments on push

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# E2E tests with Playwright
npm run test:e2e
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Radix UI](https://www.radix-ui.com/) - Headless UI components
- [React Query](https://tanstack.com/query) - Data fetching library

## 📞 Support

- Documentation: [docs.taskflow.com](https://docs.taskflow.com)
- Email: support@taskflow.com
- Discord: [Join our community](https://discord.gg/taskflow)

---

Built with ❤️ by the TaskFlow Team
