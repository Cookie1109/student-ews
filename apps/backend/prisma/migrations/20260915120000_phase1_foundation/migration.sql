-- Phase 1: reproducible warning runs and stateful student support records.
ALTER TABLE "academic_warning_runs"
    ADD COLUMN "source_snapshot" JSONB NOT NULL DEFAULT '{}',
    ADD COLUMN "source_snapshot_hash" VARCHAR(64),
    ADD COLUMN "source_captured_at" TIMESTAMPTZ(6);

CREATE INDEX "academic_warning_runs_source_captured_idx"
    ON "academic_warning_runs"("source_captured_at" DESC);

ALTER TABLE "warning_actions"
    ADD COLUMN "actor_id" UUID,
    ADD COLUMN "assigned_user_id" UUID,
    ADD COLUMN "due_date" DATE,
    ADD COLUMN "resolved_at" TIMESTAMPTZ(6),
    ADD COLUMN "status_history" JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "warning_actions" ALTER COLUMN "status" SET DEFAULT 'OPEN';

-- Existing records predate the state machine. Preserve them and make that
-- provenance explicit instead of inventing intermediate transitions.
UPDATE "warning_actions"
SET "status_history" = jsonb_build_array(jsonb_build_object(
    'event', 'migrated',
    'to', "status",
    'changedAt', "created_at",
    'actorId', NULL,
    'actorName', "actor_name"
))
WHERE "status_history" = '[]'::jsonb;

UPDATE "warning_actions"
SET "resolved_at" = "created_at"
WHERE "status" = 'RESOLVED' AND "resolved_at" IS NULL;

UPDATE "warning_actions"
SET "status" = 'IN_PROGRESS'
WHERE "status" NOT IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED', 'REOPENED');

ALTER TABLE "warning_actions"
    ADD CONSTRAINT "warning_actions_status_check"
    CHECK ("status" IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED', 'REOPENED'));

ALTER TABLE "warning_actions"
    ADD CONSTRAINT "warning_actions_actor_id_fkey"
    FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "warning_actions"
    ADD CONSTRAINT "warning_actions_assigned_user_id_fkey"
    FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "warning_actions_assignee_status_due_idx"
    ON "warning_actions"("assigned_user_id", "status", "due_date");

INSERT INTO "permissions" ("id", "code", "name", "resource", "action", "is_assignable")
VALUES
    (gen_random_uuid(), 'academic_warning.action.create', 'Tạo hồ sơ hỗ trợ', 'academic_warning_action', 'create', true),
    (gen_random_uuid(), 'academic_warning.action.update', 'Cập nhật hồ sơ hỗ trợ', 'academic_warning_action', 'update', true)
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "resource" = EXCLUDED."resource",
    "action" = EXCLUDED."action",
    "is_assignable" = true;
