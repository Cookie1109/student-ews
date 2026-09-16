-- Phase 2: conduct scoring, activities and multi-source dashboard.
ALTER TABLE "academic_warning_policies"
  ADD COLUMN "conduct_score_threshold" DECIMAL(5,2) NOT NULL DEFAULT 50;

CREATE TABLE "activities" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "source_code" VARCHAR(64) NOT NULL,
  "name" VARCHAR(500) NOT NULL,
  "type" VARCHAR(128) NOT NULL,
  "organizing_unit" VARCHAR(255),
  "academic_term_id" UUID,
  "conduct_term_id" UUID,
  "start_date" DATE,
  "end_date" DATE,
  "target_audience" VARCHAR(255),
  "description" TEXT,
  "source_payload" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_participations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "student_id" UUID NOT NULL,
  "activity_id" UUID NOT NULL,
  "status" VARCHAR(32) NOT NULL DEFAULT 'registered',
  "evidence" VARCHAR(500),
  "verified_by" UUID,
  "verified_at" TIMESTAMPTZ(6),
  "notes" TEXT,
  "source_payload" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "activity_participations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "activities_source_code_key" ON "activities"("source_code");
CREATE INDEX "activities_term_type_idx" ON "activities"("academic_term_id", "type");
CREATE INDEX "activities_conduct_term_idx" ON "activities"("conduct_term_id");
CREATE UNIQUE INDEX "participation_student_activity_unique" ON "activity_participations"("student_id", "activity_id");
CREATE INDEX "activity_participations_student_status_idx" ON "activity_participations"("student_id", "status");
CREATE INDEX "activity_participations_activity_status_idx" ON "activity_participations"("activity_id", "status");
CREATE INDEX "activity_participations_verified_by_idx" ON "activity_participations"("verified_by");

ALTER TABLE "activities"
  ADD CONSTRAINT "activities_academic_term_id_fkey" FOREIGN KEY ("academic_term_id") REFERENCES "academic_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "activities_conduct_term_id_fkey" FOREIGN KEY ("conduct_term_id") REFERENCES "academic_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "activity_participations"
  ADD CONSTRAINT "activity_participations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "activity_participations_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "activity_participations_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "activity_participations_status_check" CHECK ("status" IN ('registered', 'attended', 'completed'));

INSERT INTO "permissions" ("id", "code", "name", "resource", "action", "is_assignable")
VALUES
  (gen_random_uuid(), 'activity.read', 'Xem hoạt động', 'activity', 'read', true),
  (gen_random_uuid(), 'activity.manage', 'Quản lý hoạt động và tham gia', 'activity', 'manage', true)
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "resource" = EXCLUDED."resource",
  "action" = EXCLUDED."action",
  "is_assignable" = true;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
JOIN "permissions" p ON p."code" IN ('activity.read', 'activity.manage')
WHERE r."code" = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
JOIN "permissions" p ON p."code" = 'activity.read'
WHERE r."code" = 'class_advisor'
ON CONFLICT DO NOTHING;
