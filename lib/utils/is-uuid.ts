export function isUUID(str: string): boolean {
  if (!str || typeof str !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

export function studentIdWhere(idOrCode: string) {
  const trimmed = idOrCode.trim();
  return isUUID(trimmed) ? { id: trimmed } : { sStudentId: trimmed };
}
