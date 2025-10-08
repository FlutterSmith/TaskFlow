import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Zap, Users, BarChart } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600" />
            <span className="text-xl font-bold">TaskFlow</span>
          </div>
          <nav className="hidden gap-6 md:flex">
            <Link href="#features" className="text-sm font-medium hover:text-primary">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary">
              Pricing
            </Link>
            <Link href="#about" className="text-sm font-medium hover:text-primary">
              About
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-1 items-center">
        <div className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              Modern Task Management
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {' '}
                Made Simple
              </span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
              Streamline your workflow with TaskFlow. Collaborate in real-time, track progress,
              and achieve more together.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Everything you need</h2>
            <p className="text-lg text-muted-foreground">
              Powerful features to help your team succeed
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<CheckCircle className="h-6 w-6" />}
              title="Task Management"
              description="Create, assign, and track tasks with ease. Never miss a deadline."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Real-time Collaboration"
              description="Work together in real-time. See updates instantly across your team."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Team Workspaces"
              description="Organize your teams and projects in dedicated workspaces."
            />
            <FeatureCard
              icon={<BarChart className="h-6 w-6" />}
              title="Analytics & Insights"
              description="Track progress and productivity with detailed analytics."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 TaskFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center rounded-lg border bg-card p-6 text-center">
      <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
