import { Request } from "express";

function readForwardedHeader(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  return raw.split(",")[0]?.trim();
}

export function getPublicBaseUrl(req: Request): string {
  const forwardedProto = readForwardedHeader(req.headers["x-forwarded-proto"] as string | string[] | undefined);
  const forwardedHost = readForwardedHeader(req.headers["x-forwarded-host"] as string | string[] | undefined);

  const protocol = forwardedProto || req.protocol || "http";
  const host = forwardedHost || req.get("host") || "localhost:3000";

  return `${protocol}://${host}`;
}

export function buildPublicImageUrl(req: Request, fileName: string): string {
  return `${getPublicBaseUrl(req)}/images/${fileName}`;
}

export function normalizeAssetUrl(req: Request, value: string): string {
  const baseUrl = getPublicBaseUrl(req);

  if (value.startsWith("http://localhost:3000/images/") || value.startsWith("https://localhost:3000/images/")) {
    const fileName = value.split("/images/")[1];
    return `${baseUrl}/images/${fileName}`;
  }

  if (value.startsWith("/images/")) {
    return `${baseUrl}${value}`;
  }

  if (value.startsWith("images/")) {
    return `${baseUrl}/${value}`;
  }

  return value;
}

export function normalizeJsonAssetUrls(req: Request, payload: unknown): unknown {
  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeJsonAssetUrls(req, item));
  }

  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    const normalized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      normalized[key] = normalizeJsonAssetUrls(req, value);
    }

    return normalized;
  }

  if (typeof payload === "string") {
    return normalizeAssetUrl(req, payload);
  }

  return payload;
}
