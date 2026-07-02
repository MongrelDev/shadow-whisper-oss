import { net, protocol, type CustomScheme } from "electron";
import { join } from "path";
import { pathToFileURL } from "url";

const APP_SCHEME = "app";
const APP_HOST = "renderer";

export const APP_PROTOCOL_PRIVILEGES: CustomScheme = {
  scheme: APP_SCHEME,
  privileges: {
    standard: true,
    secure: true,
    supportFetchAPI: true,
    corsEnabled: true,
    stream: true,
    allowServiceWorkers: true,
  },
};

function resolveRendererAssetPath(requestUrl: string): string {
  const url = new URL(requestUrl);

  if (url.host !== APP_HOST) {
    throw new Error(`Unsupported app host: ${url.host}`);
  }

  const relativePath =
    url.pathname === "/" || url.pathname === "" ? "index.html" : url.pathname.slice(1);

  return join(__dirname, "../renderer", relativePath);
}

export function registerAppProtocol(): void {
  protocol.handle(APP_SCHEME, (request) =>
    net.fetch(pathToFileURL(resolveRendererAssetPath(request.url)).toString())
  );
}

export function getAppRendererUrl(hash = "/"): string {
  return `${APP_SCHEME}://${APP_HOST}/index.html#${hash}`;
}
