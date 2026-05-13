import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE_URL =
  process.env.BACKEND_API_BASE_URL ?? process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL;

function buildTargetUrl(pathSegments: string[], search: string): string {
  if (!BACKEND_BASE_URL) {
    throw new Error(
      'Missing backend base URL. Set BACKEND_API_BASE_URL or NEXT_PUBLIC_BACKEND_API_BASE_URL in the frontend deployment environment.'
    );
  }

  const base = BACKEND_BASE_URL.replace(/\/+$/, '');
  const path = pathSegments.map(encodeURIComponent).join('/');
  return `${base}/${path}${search}`;
}

async function proxyRequest(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  try {
    const { path } = await ctx.params;
    const targetUrl = buildTargetUrl(path ?? [], request.nextUrl.search);

    const headers = new Headers(request.headers);
    headers.delete('host');

    const method = request.method.toUpperCase();
    const init: RequestInit = {
      method,
      headers,
      body: method === 'GET' || method === 'HEAD' ? undefined : request.body,
      // Required when forwarding a streamed request body in Node runtime.
      duplex: 'half',
    } as RequestInit;

    const backendResponse = await fetch(targetUrl, init);
    const responseHeaders = new Headers(backendResponse.headers);
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Proxy request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, ctx);
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, ctx);
}

export async function PUT(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, ctx);
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, ctx);
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, ctx);
}
