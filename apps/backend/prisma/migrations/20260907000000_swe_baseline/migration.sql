-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "s_student_id" VARCHAR(32) NOT NULL,
    "s_first_name" VARCHAR(120) NOT NULL,
    "s_last_name" VARCHAR(200) NOT NULL,
    "s_full_name" VARCHAR(320) NOT NULL,
    "s_birth_date" DATE NOT NULL,
    "s_birth_place" VARCHAR(255),
    "s_gender" VARCHAR(32),
    "s_class_role_id" SMALLINT NOT NULL DEFAULT 0,
    "s_permanent_residence" TEXT,
    "s_is_in_class" BOOLEAN NOT NULL DEFAULT true,
    "s_class_student_id" VARCHAR(64),
    "s_study_program_id" VARCHAR(64),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_id" VARCHAR(128),
    "action" VARCHAR(64) NOT NULL,
    "resource_type" VARCHAR(64) NOT NULL,
    "resource_id" UUID,
    "request_id" VARCHAR(128),
    "details" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "class_id" VARCHAR(64) NOT NULL,
    "class_name" VARCHAR(320) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "cohort_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohorts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "s_cohort_code" VARCHAR(64) NOT NULL,
    "s_cohort_name" VARCHAR(320) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_programs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "s_program_code" VARCHAR(64) NOT NULL,
    "s_program_name" VARCHAR(320) NOT NULL,
    "s_degree_level" VARCHAR(128) NOT NULL,
    "s_major" VARCHAR(255) NOT NULL,
    "s_study_type" VARCHAR(128) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "s_faculty_code" VARCHAR(64),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',

    CONSTRAINT "training_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "s_course_code" VARCHAR(64) NOT NULL,
    "s_course_name" VARCHAR(320) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_program_courses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "training_program_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "s_semester_no" SMALLINT NOT NULL,
    "s_credits" SMALLINT NOT NULL,
    "s_theory_hours" SMALLINT,
    "s_practice_hours" SMALLINT,
    "s_requirement_type" VARCHAR(32) NOT NULL,
    "s_note" TEXT,
    "s_year_study" VARCHAR(32),
    "s_term_id" VARCHAR(32),
    "s_department_code" VARCHAR(64),
    "s_faculty_code" VARCHAR(64),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "academic_term_id" UUID,

    CONSTRAINT "training_program_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "s_year_code" VARCHAR(9) NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "status" VARCHAR(16) NOT NULL DEFAULT 'draft',
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_terms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "academic_year_id" UUID NOT NULL,
    "s_term_code" VARCHAR(8) NOT NULL,
    "s_term_name" VARCHAR(64) NOT NULL,
    "s_term_order" SMALLINT NOT NULL,
    "s_is_summer" BOOLEAN NOT NULL DEFAULT false,
    "start_date" DATE,
    "end_date" DATE,
    "status" VARCHAR(16) NOT NULL DEFAULT 'draft',
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "academic_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_import_batches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source_hash" VARCHAR(64) NOT NULL,
    "status" VARCHAR(16) NOT NULL,
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "imported_rows" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "idempotency_key" VARCHAR(128),

    CONSTRAINT "grade_import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_course_offerings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "academic_term_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "s_student_id" VARCHAR(32) NOT NULL,
    "s_program_code" VARCHAR(64),
    "s_curriculum_id" VARCHAR(64) NOT NULL,
    "s_study_unit_id" VARCHAR(64) NOT NULL,
    "s_schedule_study_unit_id" VARCHAR(128) NOT NULL DEFAULT '',
    "s_course_name" VARCHAR(320) NOT NULL,
    "s_course_name_eng" VARCHAR(320),
    "s_course_group" VARCHAR(32),
    "s_credits" SMALLINT NOT NULL,
    "source_payload" JSONB NOT NULL DEFAULT '{}',
    "source_md5" VARCHAR(64),
    "grade_import_batch_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_course_offerings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_course_grades" (
    "offering_id" UUID NOT NULL,
    "score_10" DECIMAL(4,2),
    "score_4" DECIMAL(3,2),
    "letter_code" VARCHAR(8),
    "special_code" VARCHAR(16),
    "is_pass" BOOLEAN NOT NULL DEFAULT false,
    "is_gather" BOOLEAN NOT NULL DEFAULT false,
    "not_score" BOOLEAN NOT NULL DEFAULT false,
    "not_compute_average_score" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "score_status" VARCHAR(16) NOT NULL,
    "source_payload" JSONB NOT NULL DEFAULT '{}',
    "source_md5" VARCHAR(64),
    "grade_import_batch_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_course_grades_pkey" PRIMARY KEY ("offering_id")
);

-- CreateTable
CREATE TABLE "student_term_summaries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "academic_term_id" UUID NOT NULL,
    "credits_earned" DECIMAL(8,2),
    "registered_credits" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "gpa_10" DECIMAL(4,2),
    "gpa_4" DECIMAL(3,2),
    "cumulative_credits" DECIMAL(8,2),
    "cumulative_gpa_10" DECIMAL(4,2),
    "cumulative_gpa_4" DECIMAL(3,2),
    "conduct_score" DECIMAL(5,2),
    "classification_name" VARCHAR(64),
    "source_payload" JSONB NOT NULL DEFAULT '{}',
    "grade_import_batch_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "s_program_code" VARCHAR(64) NOT NULL,

    CONSTRAINT "student_term_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_cumulative_summaries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "s_program_code" VARCHAR(64) NOT NULL DEFAULT '',
    "grade_import_batch_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cumulative_credits" DECIMAL(8,2),
    "cumulative_gpa_10" DECIMAL(4,2),
    "cumulative_gpa_4" DECIMAL(3,2),
    "source_term_summary_id" UUID NOT NULL,
    "source_academic_year_id" UUID NOT NULL,
    "source_academic_term_id" UUID NOT NULL,
    "refreshed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cumulative_registered_credits" DECIMAL(8,2) NOT NULL DEFAULT 0,

    CONSTRAINT "student_cumulative_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_import_errors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "grade_import_batch_id" UUID NOT NULL,
    "row_number" INTEGER NOT NULL,
    "student_id" VARCHAR(32),
    "message" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "grade_import_errors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_types" (
    "decision_type_id" INTEGER NOT NULL,
    "decision_name" VARCHAR(320) NOT NULL,
    "category" VARCHAR(16) NOT NULL DEFAULT 'other',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "decision_types_pkey" PRIMARY KEY ("decision_type_id")
);

-- CreateTable
CREATE TABLE "student_decisions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "academic_term_id" UUID NOT NULL,
    "decision_type_id" INTEGER NOT NULL,
    "s_student_id" VARCHAR(32) NOT NULL,
    "s_year_study" VARCHAR(9) NOT NULL,
    "s_term_id" VARCHAR(8) NOT NULL,
    "s_decision_number" VARCHAR(255) NOT NULL,
    "s_decision_alias" VARCHAR(255) NOT NULL DEFAULT '',
    "s_sign_staff" VARCHAR(320) NOT NULL DEFAULT '',
    "s_sign_date" DATE,
    "s_decision_name" VARCHAR(320) NOT NULL DEFAULT '',
    "s_reason" TEXT NOT NULL DEFAULT '',
    "s_full_text" TEXT NOT NULL DEFAULT '',
    "s_update_staff" VARCHAR(128),
    "s_update_date" DATE,
    "source_payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "is_academic_warning" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "student_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_policy_types" (
    "fee_object_dic_id" VARCHAR(64) NOT NULL,
    "fee_object_dic_name" VARCHAR(320) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "fee_policy_types_pkey" PRIMARY KEY ("fee_object_dic_id")
);

-- CreateTable
CREATE TABLE "student_fee_policies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "academic_term_id" UUID NOT NULL,
    "fee_object_dic_id" VARCHAR(64) NOT NULL,
    "s_student_id" VARCHAR(32) NOT NULL,
    "s_fee_object_id" BIGINT NOT NULL,
    "s_year_study" VARCHAR(9) NOT NULL,
    "s_term_id" VARCHAR(8) NOT NULL,
    "s_fee_object_dic_name" VARCHAR(320) NOT NULL,
    "s_coefficient" VARCHAR(64) NOT NULL,
    "coefficient_percent" DECIMAL(5,2) NOT NULL,
    "s_decision_number" VARCHAR(255) NOT NULL,
    "source_payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "student_fee_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "username" VARCHAR(128) NOT NULL,
    "email" VARCHAR(320),
    "password_hash" TEXT NOT NULL,
    "full_name" VARCHAR(320) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "data_scope" VARCHAR(32) NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(128) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "resource" VARCHAR(64) NOT NULL,
    "action" VARCHAR(32) NOT NULL,
    "is_assignable" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "lecturer_profiles" (
    "user_id" UUID NOT NULL,
    "staff_code" VARCHAR(64) NOT NULL,
    "faculty_code" VARCHAR(64),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecturer_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "class_advisor_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "academic_term_id" UUID NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" UUID,
    "revoked_at" TIMESTAMPTZ(6),
    "revoked_by" UUID,

    CONSTRAINT "class_advisor_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(128) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "replaced_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_progress_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cohort_id" UUID NOT NULL,
    "training_program_id" UUID NOT NULL,
    "academic_year_id" UUID NOT NULL,
    "academic_term_id" UUID NOT NULL,
    "curriculum_semester_no" SMALLINT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'draft',
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "required_elective_credits" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clone_batch_id" UUID,
    "cloned_from_plan_id" UUID,
    "cloned_from_program_id" UUID,
    "is_program_final" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "training_progress_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_progress_plan_courses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "plan_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "s_course_code" VARCHAR(64) NOT NULL,
    "s_course_name" VARCHAR(320) NOT NULL,
    "s_credits" SMALLINT NOT NULL,
    "requirement_type" VARCHAR(16) NOT NULL,
    "is_registration_required" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "choice_group_code" VARCHAR(64),

    CONSTRAINT "training_progress_plan_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_progress_calculation_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "plan_id" UUID NOT NULL,
    "plan_version" INTEGER NOT NULL,
    "status" VARCHAR(16) NOT NULL,
    "total_students" INTEGER NOT NULL DEFAULT 0,
    "pass_students" INTEGER NOT NULL DEFAULT 0,
    "fail_students" INTEGER NOT NULL DEFAULT 0,
    "data_error_students" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "source_snapshot" JSONB NOT NULL DEFAULT '[]',
    "source_snapshot_hash" VARCHAR(64),
    "source_captured_at" TIMESTAMPTZ(6),
    "source_oldest_synced_at" TIMESTAMPTZ(6),
    "source_latest_synced_at" TIMESTAMPTZ(6),
    "offering_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "training_progress_calculation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_progress_student_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "run_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "class_id" UUID,
    "cohort_id" UUID,
    "s_student_id" VARCHAR(32) NOT NULL,
    "s_student_name" VARCHAR(320) NOT NULL,
    "s_class_student_id" VARCHAR(64),
    "s_class_name" VARCHAR(320),
    "s_program_code" VARCHAR(64),
    "mandatory_required_courses" INTEGER NOT NULL DEFAULT 0,
    "mandatory_registered_courses" INTEGER NOT NULL DEFAULT 0,
    "mandatory_required_credits" INTEGER NOT NULL DEFAULT 0,
    "mandatory_registered_credits" INTEGER NOT NULL DEFAULT 0,
    "missing_mandatory_courses" INTEGER NOT NULL DEFAULT 0,
    "required_elective_courses" INTEGER NOT NULL DEFAULT 0,
    "registered_required_elective_courses" INTEGER NOT NULL DEFAULT 0,
    "missing_required_elective_courses" INTEGER NOT NULL DEFAULT 0,
    "required_elective_credits" INTEGER NOT NULL DEFAULT 0,
    "registered_elective_credits" INTEGER NOT NULL DEFAULT 0,
    "missing_credits" INTEGER NOT NULL DEFAULT 0,
    "outside_plan_courses" INTEGER NOT NULL DEFAULT 0,
    "outside_plan_credits" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(16) NOT NULL,
    "calculated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "choice_group_results" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "training_progress_student_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_progress_course_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_result_id" UUID NOT NULL,
    "course_id" UUID,
    "s_course_code" VARCHAR(64) NOT NULL,
    "s_course_name" VARCHAR(320) NOT NULL,
    "s_credits" SMALLINT NOT NULL,
    "result_group" VARCHAR(16) NOT NULL,
    "is_registration_required" BOOLEAN NOT NULL DEFAULT false,
    "registration_status" VARCHAR(16) NOT NULL,
    "choice_group_code" VARCHAR(64),

    CONSTRAINT "training_progress_course_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_progress_group_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "run_id" UUID NOT NULL,
    "group_type" VARCHAR(16) NOT NULL,
    "group_id" UUID NOT NULL,
    "group_code" VARCHAR(64) NOT NULL,
    "group_name" VARCHAR(320),
    "total_students" INTEGER NOT NULL DEFAULT 0,
    "pass_students" INTEGER NOT NULL DEFAULT 0,
    "fail_students" INTEGER NOT NULL DEFAULT 0,
    "data_error_students" INTEGER NOT NULL DEFAULT 0,
    "total_missing_credits" INTEGER NOT NULL DEFAULT 0,
    "calculated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_progress_group_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_progress_completion_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cohort_id" UUID NOT NULL,
    "training_program_id" UUID NOT NULL,
    "assessment_academic_term_id" UUID NOT NULL,
    "source_snapshot" JSONB NOT NULL DEFAULT '{}',
    "source_snapshot_hash" VARCHAR(64),
    "source_captured_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(16) NOT NULL,
    "total_students" INTEGER NOT NULL DEFAULT 0,
    "completed_students" INTEGER NOT NULL DEFAULT 0,
    "incomplete_students" INTEGER NOT NULL DEFAULT 0,
    "cannot_determine_students" INTEGER NOT NULL DEFAULT 0,
    "on_track_students" INTEGER NOT NULL DEFAULT 0,
    "behind_schedule_students" INTEGER NOT NULL DEFAULT 0,
    "no_due_plan_students" INTEGER NOT NULL DEFAULT 0,
    "data_error_students" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "publication_status" VARCHAR(16) NOT NULL DEFAULT 'archived',
    "pending_result_students" INTEGER NOT NULL DEFAULT 0,
    "evaluation_mode" VARCHAR(32) NOT NULL DEFAULT 'standard',
    "evaluation_scope" VARCHAR(32) NOT NULL DEFAULT 'program_completion',

    CONSTRAINT "training_progress_completion_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_progress_completion_student_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "run_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "class_id" UUID,
    "cohort_id" UUID,
    "s_student_id" VARCHAR(32) NOT NULL,
    "s_student_name" VARCHAR(320) NOT NULL,
    "s_class_student_id" VARCHAR(64),
    "s_class_name" VARCHAR(320),
    "s_program_code" VARCHAR(64),
    "due_plans_total" INTEGER NOT NULL DEFAULT 0,
    "due_plans_passed" INTEGER NOT NULL DEFAULT 0,
    "due_plans_failed" INTEGER NOT NULL DEFAULT 0,
    "all_plans_total" INTEGER NOT NULL DEFAULT 0,
    "all_plans_passed" INTEGER NOT NULL DEFAULT 0,
    "all_plans_failed" INTEGER NOT NULL DEFAULT 0,
    "missing_mandatory_courses" INTEGER NOT NULL DEFAULT 0,
    "missing_required_elective_courses" INTEGER NOT NULL DEFAULT 0,
    "missing_elective_credits" INTEGER NOT NULL DEFAULT 0,
    "schedule_status" VARCHAR(24) NOT NULL,
    "program_completion_status" VARCHAR(24) NOT NULL,
    "data_error_reason" TEXT,
    "calculated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cumulative_gpa_10" DECIMAL(4,2),
    "cumulative_gpa_4" DECIMAL(3,2),
    "gpa_academic_year" VARCHAR(16),
    "gpa_term_code" VARCHAR(16),
    "pending_result_courses" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "training_progress_completion_student_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_progress_completion_plan_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_result_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "plan_version" INTEGER NOT NULL,
    "academic_term_id" UUID NOT NULL,
    "curriculum_semester_no" SMALLINT NOT NULL,
    "is_due" BOOLEAN NOT NULL,
    "is_pass" BOOLEAN NOT NULL,
    "missing_mandatory_courses" INTEGER NOT NULL DEFAULT 0,
    "missing_required_elective_courses" INTEGER NOT NULL DEFAULT 0,
    "required_elective_credits" INTEGER NOT NULL DEFAULT 0,
    "passed_elective_credits" INTEGER NOT NULL DEFAULT 0,
    "missing_elective_credits" INTEGER NOT NULL DEFAULT 0,
    "choice_group_results" JSONB NOT NULL DEFAULT '[]',
    "pending_result_courses" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "training_progress_completion_plan_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_progress_completion_group_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "run_id" UUID NOT NULL,
    "group_type" VARCHAR(16) NOT NULL,
    "group_id" UUID NOT NULL,
    "group_code" VARCHAR(64) NOT NULL,
    "group_name" VARCHAR(320),
    "total_students" INTEGER NOT NULL DEFAULT 0,
    "completed_students" INTEGER NOT NULL DEFAULT 0,
    "incomplete_students" INTEGER NOT NULL DEFAULT 0,
    "cannot_determine_students" INTEGER NOT NULL DEFAULT 0,
    "on_track_students" INTEGER NOT NULL DEFAULT 0,
    "behind_schedule_students" INTEGER NOT NULL DEFAULT 0,
    "calculated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pending_result_students" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "training_progress_completion_group_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_warning_policies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(160) NOT NULL,
    "term_gpa_threshold" DECIMAL(4,2) NOT NULL,
    "cumulative_gpa_threshold" DECIMAL(4,2) NOT NULL,
    "version" INTEGER NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_warning_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_warning_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cohort_id" UUID NOT NULL,
    "training_program_id" UUID NOT NULL,
    "assessment_academic_term_id" UUID NOT NULL,
    "policy_id" UUID,
    "policy_version" INTEGER,
    "completion_run_id" UUID,
    "progress_run_id" UUID,
    "status" VARCHAR(16) NOT NULL,
    "total_students" INTEGER NOT NULL DEFAULT 0,
    "warning_students" INTEGER NOT NULL DEFAULT 0,
    "medium_students" INTEGER NOT NULL DEFAULT 0,
    "high_students" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "created_by" UUID,

    CONSTRAINT "academic_warning_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_warning_student_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "run_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "class_id" UUID,
    "cohort_id" UUID,
    "s_student_id" VARCHAR(32) NOT NULL,
    "s_student_name" VARCHAR(320) NOT NULL,
    "s_class_name" VARCHAR(320),
    "s_program_code" VARCHAR(64),
    "term_registered_credits" DECIMAL(8,2),
    "term_gpa_4" DECIMAL(4,2),
    "term_gpa_10" DECIMAL(4,2),
    "cumulative_gpa_4" DECIMAL(4,2),
    "cumulative_gpa_10" DECIMAL(4,2),
    "registration_status" VARCHAR(16) NOT NULL,
    "schedule_status" VARCHAR(24) NOT NULL,
    "academic_warning_decisions" INTEGER NOT NULL DEFAULT 0,
    "max_severity" VARCHAR(16) NOT NULL,
    "reason_count" INTEGER NOT NULL DEFAULT 0,
    "data_error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_warning_student_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_warning_reasons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_result_id" UUID NOT NULL,
    "reason_code" VARCHAR(48) NOT NULL,
    "severity" VARCHAR(16) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "source_type" VARCHAR(64),
    "source_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_warning_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_warning_group_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "run_id" UUID NOT NULL,
    "group_type" VARCHAR(16) NOT NULL,
    "group_id" UUID,
    "group_code" VARCHAR(64) NOT NULL,
    "group_name" VARCHAR(320),
    "total_students" INTEGER NOT NULL DEFAULT 0,
    "warning_students" INTEGER NOT NULL DEFAULT 0,
    "medium_students" INTEGER NOT NULL DEFAULT 0,
    "high_students" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_warning_group_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_progress_completion_course_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "plan_result_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "s_course_code" VARCHAR(64) NOT NULL,
    "s_course_name" VARCHAR(320) NOT NULL,
    "s_credits" SMALLINT NOT NULL,
    "requirement_type" VARCHAR(16) NOT NULL,
    "choice_group_code" VARCHAR(64),
    "is_registration_required" BOOLEAN NOT NULL DEFAULT false,
    "passed" BOOLEAN NOT NULL,
    "evidence_offering_id" UUID,
    "evidence_academic_year" VARCHAR(16),
    "evidence_term_code" VARCHAR(16),
    "evidence_score_status" VARCHAR(16),
    "pending_result" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "training_progress_completion_course_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warning_actions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "run_id" UUID,
    "action_type" VARCHAR(64) NOT NULL,
    "note" TEXT NOT NULL,
    "actor_name" VARCHAR(255),
    "status" VARCHAR(32) NOT NULL DEFAULT 'IN_PROGRESS',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warning_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "students_filters_idx" ON "students"("s_is_in_class", "s_class_role_id", "s_gender", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource_type", "resource_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "classes_s_class_student_id_key" ON "classes"("class_id");

-- CreateIndex
CREATE UNIQUE INDEX "cohorts_s_cohort_code_key" ON "cohorts"("s_cohort_code");

-- CreateIndex
CREATE UNIQUE INDEX "training_programs_s_program_code_key" ON "training_programs"("s_program_code");

-- CreateIndex
CREATE UNIQUE INDEX "courses_s_course_code_key" ON "courses"("s_course_code");

-- CreateIndex
CREATE INDEX "training_program_courses_semester_idx" ON "training_program_courses"("training_program_id", "s_semester_no");

-- CreateIndex
CREATE INDEX "training_program_courses_term_idx" ON "training_program_courses"("academic_term_id");

-- CreateIndex
CREATE UNIQUE INDEX "training_program_courses_training_program_id_course_id_key" ON "training_program_courses"("training_program_id", "course_id");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_s_year_code_key" ON "academic_years"("s_year_code");

-- CreateIndex
CREATE UNIQUE INDEX "academic_terms_academic_year_id_s_term_code_key" ON "academic_terms"("academic_year_id", "s_term_code");

-- CreateIndex
CREATE UNIQUE INDEX "academic_terms_academic_year_id_s_term_order_key" ON "academic_terms"("academic_year_id", "s_term_order");

-- CreateIndex
CREATE UNIQUE INDEX "academic_terms_id_year_key" ON "academic_terms"("id", "academic_year_id");

-- CreateIndex
CREATE INDEX "student_course_offerings_course_idx" ON "student_course_offerings"("s_curriculum_id", "academic_year_id", "academic_term_id");

-- CreateIndex
CREATE INDEX "student_course_offerings_student_term_idx" ON "student_course_offerings"("student_id", "academic_term_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_course_offerings_student_id_academic_term_id_s_stud_key" ON "student_course_offerings"("student_id", "academic_term_id", "s_study_unit_id", "s_schedule_study_unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_term_summaries_student_program_term_key" ON "student_term_summaries"("student_id", "s_program_code", "academic_term_id");

-- CreateIndex
CREATE INDEX "student_cumulative_summaries_source_term_idx" ON "student_cumulative_summaries"("source_academic_year_id", "source_academic_term_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_cumulative_summaries_student_id_s_program_code_key" ON "student_cumulative_summaries"("student_id", "s_program_code");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "lecturer_profiles_staff_code_key" ON "lecturer_profiles"("staff_code");

-- CreateIndex
CREATE UNIQUE INDEX "class_advisor_assignments_user_id_academic_term_id_key" ON "class_advisor_assignments"("user_id", "academic_term_id");

-- CreateIndex
CREATE UNIQUE INDEX "class_advisor_assignments_class_id_academic_term_id_key" ON "class_advisor_assignments"("class_id", "academic_term_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_idx" ON "refresh_tokens"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "training_progress_plans_scope_idx" ON "training_progress_plans"("cohort_id", "training_program_id", "academic_term_id", "version" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "training_progress_plans_cohort_id_training_program_id_acade_key" ON "training_progress_plans"("cohort_id", "training_program_id", "academic_term_id", "version");

-- CreateIndex
CREATE INDEX "training_progress_plan_courses_plan_idx" ON "training_progress_plan_courses"("plan_id", "requirement_type", "course_id");

-- CreateIndex
CREATE UNIQUE INDEX "training_progress_plan_courses_plan_id_course_id_key" ON "training_progress_plan_courses"("plan_id", "course_id");

-- CreateIndex
CREATE INDEX "training_progress_runs_plan_idx" ON "training_progress_calculation_runs"("plan_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "training_progress_runs_source_captured_idx" ON "training_progress_calculation_runs"("source_captured_at" DESC);

-- CreateIndex
CREATE INDEX "training_progress_student_results_run_class_idx" ON "training_progress_student_results"("run_id", "class_id", "s_student_id");

-- CreateIndex
CREATE INDEX "training_progress_student_results_run_status_idx" ON "training_progress_student_results"("run_id", "status", "s_student_id");

-- CreateIndex
CREATE UNIQUE INDEX "training_progress_student_results_run_id_student_id_key" ON "training_progress_student_results"("run_id", "student_id");

-- CreateIndex
CREATE INDEX "training_progress_course_results_student_idx" ON "training_progress_course_results"("student_result_id", "result_group", "registration_status");

-- CreateIndex
CREATE UNIQUE INDEX "training_progress_course_resu_student_result_id_s_course_co_key" ON "training_progress_course_results"("student_result_id", "s_course_code", "result_group");

-- CreateIndex
CREATE INDEX "training_progress_group_results_run_idx" ON "training_progress_group_results"("run_id", "group_type", "group_code");

-- CreateIndex
CREATE UNIQUE INDEX "training_progress_group_results_run_id_group_type_group_id_key" ON "training_progress_group_results"("run_id", "group_type", "group_id");

-- CreateIndex
CREATE INDEX "training_progress_completion_runs_scope_idx" ON "training_progress_completion_runs"("cohort_id", "training_program_id", "assessment_academic_term_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "training_progress_completion_students_class_idx" ON "training_progress_completion_student_results"("run_id", "class_id", "s_student_id");

-- CreateIndex
CREATE INDEX "training_progress_completion_students_status_idx" ON "training_progress_completion_student_results"("run_id", "program_completion_status", "schedule_status", "s_student_id");

-- CreateIndex
CREATE UNIQUE INDEX "training_progress_completion_student_resu_run_id_student_id_key" ON "training_progress_completion_student_results"("run_id", "student_id");

-- CreateIndex
CREATE INDEX "training_progress_completion_plan_results_student_idx" ON "training_progress_completion_plan_results"("student_result_id", "is_due", "is_pass");

-- CreateIndex
CREATE UNIQUE INDEX "training_progress_completion_plan_student_result_id_plan_id_key" ON "training_progress_completion_plan_results"("student_result_id", "plan_id");

-- CreateIndex
CREATE INDEX "training_progress_completion_group_results_idx" ON "training_progress_completion_group_results"("run_id", "group_type", "group_code");

-- CreateIndex
CREATE UNIQUE INDEX "training_progress_completion_gro_run_id_group_type_group_id_key" ON "training_progress_completion_group_results"("run_id", "group_type", "group_id");

-- CreateIndex
CREATE INDEX "academic_warning_runs_scope_idx" ON "academic_warning_runs"("cohort_id", "training_program_id", "assessment_academic_term_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "academic_warning_student_results_run_idx" ON "academic_warning_student_results"("run_id", "max_severity", "s_student_id");

-- CreateIndex
CREATE UNIQUE INDEX "academic_warning_student_results_run_id_student_id_key" ON "academic_warning_student_results"("run_id", "student_id");

-- CreateIndex
CREATE INDEX "academic_warning_reasons_code_idx" ON "academic_warning_reasons"("reason_code", "student_result_id");

-- CreateIndex
CREATE UNIQUE INDEX "academic_warning_reasons_student_result_id_reason_code_key" ON "academic_warning_reasons"("student_result_id", "reason_code");

-- CreateIndex
CREATE INDEX "academic_warning_group_results_run_idx" ON "academic_warning_group_results"("run_id", "group_type", "group_code");

-- CreateIndex
CREATE UNIQUE INDEX "academic_warning_group_results_run_id_group_type_group_id_key" ON "academic_warning_group_results"("run_id", "group_type", "group_id");

-- CreateIndex
CREATE INDEX "training_progress_completion_course_results_plan_idx" ON "training_progress_completion_course_results"("plan_result_id", "passed", "requirement_type", "s_course_code");

-- CreateIndex
CREATE UNIQUE INDEX "training_progress_completion_cours_plan_result_id_course_id_key" ON "training_progress_completion_course_results"("plan_result_id", "course_id");

-- CreateIndex
CREATE INDEX "warning_actions_student_idx" ON "warning_actions"("student_id", "created_at" DESC);
