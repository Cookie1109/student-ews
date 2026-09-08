-- Preserve source grade rows that cannot yet be assigned to an academic period.
CREATE TABLE "unscoped_grade_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "s_student_id" VARCHAR(32) NOT NULL,
    "s_course_code" VARCHAR(64),
    "s_course_name" VARCHAR(320),
    "s_credits" SMALLINT,
    "reason" VARCHAR(128) NOT NULL,
    "source_payload" JSONB NOT NULL DEFAULT '{}',
    "source_md5" VARCHAR(64),
    "grade_import_batch_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unscoped_grade_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "unscoped_grade_records_student_idx" ON "unscoped_grade_records"("student_id");
CREATE INDEX "unscoped_grade_records_batch_idx" ON "unscoped_grade_records"("grade_import_batch_id");

-- Official conduct scores returned by LayBangDiemRenLuyenTheoLop.
CREATE TABLE "student_conduct_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "academic_term_id" UUID NOT NULL,
    "s_student_id" VARCHAR(32) NOT NULL,
    "s_class_student_id" VARCHAR(64),
    "orders" SMALLINT,
    "student_score" DECIMAL(5,2),
    "class_score" DECIMAL(5,2),
    "department_score" DECIMAL(5,2),
    "status_id" VARCHAR(32),
    "last_score" DECIMAL(5,2),
    "source_update_day" VARCHAR(64),
    "source_update_staff" VARCHAR(128),
    "source_payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_conduct_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "student_conduct_records_student_term_key" ON "student_conduct_records"("student_id", "academic_term_id");
CREATE INDEX "student_conduct_records_period_class_idx" ON "student_conduct_records"("academic_year_id", "academic_term_id", "s_class_student_id");
