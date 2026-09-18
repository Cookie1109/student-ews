INSERT INTO "permissions" ("id", "code", "name", "resource", "action", "is_assignable")
VALUES (gen_random_uuid(), 'report.export', 'Xuất báo cáo', 'report', 'export', true)
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "resource" = EXCLUDED."resource",
  "action" = EXCLUDED."action",
  "is_assignable" = true;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."code" IN ('admin', 'class_advisor')
  AND p."code" = 'report.export'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
