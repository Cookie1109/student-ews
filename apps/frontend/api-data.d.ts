/**
 * Payload returned by the internal JSON API while individual screens are
 * progressively migrated to dedicated response interfaces.
 */
type ApiData = ReturnType<typeof JSON.parse>;
