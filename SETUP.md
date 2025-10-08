# TaskFlow Frontend - Setup Guide

## 🚀 Quick Start

Get TaskFlow running locally in 5 minutes.

### Step 1: Prerequisites

Ensure you have the following installed:
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **yarn**
- **Git**

### Step 2: Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-org/taskflow.git
cd taskflow

# Install dependencies
npm install
```

### Step 3: Environment Setup

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-random-secret-here

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=http://localhost:4000

# OAuth (Optional - for Google login)
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Step 4: Start Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

---

## 🔧 Detailed Configuration

### Backend API Setup

TaskFlow frontend requires the backend API to be running. See the backend repository for setup instructions.

**Expected API endpoints:**
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/projects` - List projects
- `GET /api/v1/tasks` - List tasks
- `POST /api/v1/tasks` - Create task
- `PATCH /api/v1/tasks/:id` - Update task

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to `.env.local`

### Database (Handled by Backend)

The frontend doesn't directly connect to the database. All data operations go through the backend API.

---

## 📁 Project Structure Overview

```
taskflow-frontend/
├── public/                    # Static assets
│   ├── manifest.json         # PWA manifest
│   └── sw.js                 # Service worker
├── src/
│   ├── app/                  # Next.js 14 App Router
│   │   ├── (auth)/          # Authentication pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/     # Protected dashboard
│   │   │   ├── dashboard/
│   │   │   ├── projects/
│   │   │   └── tasks/
│   │   └── api/             # API routes
│   ├── components/           # React components
│   │   ├── ui/              # Base UI components
│   │   ├── layout/          # Layout components
│   │   ├── board/           # Kanban board
│   │   ├── task/            # Task components
│   │   └── shared/          # Shared utilities
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilities
│   ├── stores/              # Zustand state
│   ├── styles/              # Global styles
│   └── types/               # TypeScript types
└── ...config files
```

---

## 🎨 Development Workflow

### Adding New Features

1. **Create a new branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the project structure

3. **Run linting and formatting:**
   ```bash
   npm run lint
   npm run format
   ```

4. **Test your changes:**
   ```bash
   npm run type-check
   npm test
   ```

5. **Commit and push:**
   ```bash
   git commit -m "feat: add your feature"
   git push origin feature/your-feature-name
   ```

### Component Development

When creating new components:

1. **Use TypeScript** - Define proper types
2. **Follow naming conventions** - PascalCase for components
3. **Use Tailwind CSS** - Utility-first styling
4. **Make it responsive** - Mobile-first approach
5. **Add accessibility** - ARIA labels, keyboard navigation

Example component:

```tsx
// src/components/example/ExampleComponent.tsx
'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ExampleComponentProps {
  title: string;
  onClick?: () => void;
  className?: string;
}

export function ExampleComponent({
  title,
  onClick,
  className
}: ExampleComponentProps) {
  return (
    <div className={cn('p-4 rounded-lg border', className)}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <Button onClick={onClick}>Click me</Button>
    </div>
  );
}
```

### State Management

**When to use what:**

- **React Query** - Server state (API data)
- **Zustand** - Client state (UI state, global app state)
- **useState** - Local component state

Example with React Query:

```tsx
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects'),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.post('/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
```

---

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### E2E Tests

```bash
npm run test:e2e
```

### Writing Tests

```tsx
import { render, screen } from '@testing-library/react';
import { ExampleComponent } from './ExampleComponent';

describe('ExampleComponent', () => {
  it('renders title correctly', () => {
    render(<ExampleComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

---

## 🚢 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
2. **Import project** in Vercel dashboard
3. **Add environment variables**
4. **Deploy**

Automatic deployments on every push to main.

### Docker

```bash
# Build image
docker build -t taskflow-frontend .

# Run container
docker run -p 3000:3000 taskflow-frontend
```

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 🐛 Troubleshooting

### "Module not found" errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### "Cannot find module '@/components/...'"

Check `tsconfig.json` paths configuration:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### API connection errors

1. Verify backend is running
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Check network tab in browser DevTools
4. Verify CORS is enabled on backend

### Dark mode not working

Clear browser cache and local storage:

```javascript
localStorage.clear();
location.reload();
```

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest/docs/react/overview)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

## 💡 Tips and Best Practices

### Performance

1. **Use Server Components** where possible
2. **Lazy load heavy components:**
   ```tsx
   const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
     loading: () => <Skeleton />
   });
   ```
3. **Optimize images** with Next.js Image component
4. **Minimize bundle size** - check with `npm run build`

### Security

1. **Never commit `.env.local`**
2. **Use environment variables** for sensitive data
3. **Validate all user inputs** with Zod
4. **Keep dependencies updated** - run `npm audit`

### Accessibility

1. **Use semantic HTML** (`<button>`, `<nav>`, `<main>`)
2. **Add ARIA labels** for screen readers
3. **Ensure keyboard navigation** works
4. **Test with screen reader** (NVDA, JAWS, VoiceOver)
5. **Maintain color contrast** (WCAG AA minimum)

---

## 🤝 Getting Help

- **Discord**: [Join our community](https://discord.gg/taskflow)
- **GitHub Issues**: [Report bugs](https://github.com/your-org/taskflow/issues)
- **Email**: dev@taskflow.com

---

Happy coding! 🎉
