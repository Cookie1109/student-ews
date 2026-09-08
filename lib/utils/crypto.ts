import crypto from "crypto";

export function sha256Hex(data: string | Buffer): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function md5Hex(data: string | Buffer): string {
  return crypto.createHash("md5").update(data).digest("hex");
}

export function randomToken(bytes = 48): string {
  return crypto.randomBytes(bytes).toString("hex");
}
