import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check application health
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        api: await checkApiHealth(),
        memory: checkMemory(),
      },
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}

async function checkApiHealth(): Promise<{ status: string; responseTime?: number }> {
  try {
    const startTime = Date.now();
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return { status: 'healthy', responseTime };
    } else {
      return { status: 'degraded', responseTime };
    }
  } catch (error) {
    return { status: 'unhealthy' };
  }
}

function checkMemory(): { status: string; usage: NodeJS.MemoryUsage } {
  const usage = process.memoryUsage();
  const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;

  return {
    status: heapUsedPercent > 90 ? 'warning' : 'healthy',
    usage,
  };
}
