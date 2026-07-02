import { workerApiUrl } from "@/lib/sign-up";

const AUTH_BASE_PATH = "/api/auth";

async function proxyAuth(
  request: Request,
  params: Promise<{ auth?: string[] }>
): Promise<Response> {
  const { auth = [] } = await params;
  const target = new URL(`${AUTH_BASE_PATH}/${auth.join("/")}`, workerApiUrl());
  const sourceUrl = new URL(request.url);
  target.search = sourceUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");

  const response = await fetch(target, {
    method: request.method,
    headers,
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer(),
    redirect: "manual",
    cache: "no-store",
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ auth?: string[] }> }
): Promise<Response> {
  return proxyAuth(request, context.params);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ auth?: string[] }> }
): Promise<Response> {
  return proxyAuth(request, context.params);
}

export async function OPTIONS(
  request: Request,
  context: { params: Promise<{ auth?: string[] }> }
): Promise<Response> {
  return proxyAuth(request, context.params);
}
