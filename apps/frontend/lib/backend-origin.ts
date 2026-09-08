// Server configuration only. Browser code continues to use /api/v1.
export function backendOrigin(): string {
  const value = process.env.BACKEND_URL || "http://127.0.0.1:3001";
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
      url.pathname !== "/" || url.search || url.hash) {
    throw new Error("BACKEND_URL must be an HTTP(S) origin without credentials, path or query");
  }
  return url.origin;
}
