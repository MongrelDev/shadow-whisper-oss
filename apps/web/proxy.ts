import { NextResponse, type NextRequest } from "next/server";
import { paraglideMiddleware } from "~/paraglide/server";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const localizedUrl = request.url;

  if (pathname === "/" || pathname === "/pt-BR" || pathname === "/pt-BR/") {
    const headers = new Headers(request.headers);
    headers.set("x-paraglide-locale", pathname.startsWith("/pt-BR") ? "pt-BR" : "en");
    headers.set("x-paraglide-request-url", localizedUrl);
    return NextResponse.next({ request: { headers } });
  }

  return paraglideMiddleware(request, ({ request: routedRequest, locale }) => {
    const headers = new Headers(routedRequest.headers);
    headers.set("x-paraglide-locale", locale);
    headers.set("x-paraglide-request-url", localizedUrl);

    const routedPathname = new URL(routedRequest.url).pathname;
    if (routedPathname === pathname) {
      return NextResponse.next({ request: { headers } });
    }
    return NextResponse.rewrite(routedRequest.url, { request: { headers } });
  });
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|app-icon.png|logo-light.svg|logo-dark.svg).*)",
  ],
};
