-- The project has no authoritative student activity-participation source.
-- Retire the obsolete permissions while retaining the historical tables so
-- deployments do not destroy any records that may already exist.
DELETE FROM "role_permissions"
WHERE "permission_id" IN (
  SELECT "id" FROM "permissions" WHERE "code" IN ('activity.read', 'activity.manage')
);

DELETE FROM "permissions"
WHERE "code" IN ('activity.read', 'activity.manage');
