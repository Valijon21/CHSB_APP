-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "district_id" TEXT NOT NULL,
    "school_type" TEXT NOT NULL DEFAULT 'comprehensive',
    "student_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "hashed_password" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'TEACHER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_groups" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade_level" INTEGER NOT NULL,
    "shift" INTEGER NOT NULL DEFAULT 1,
    "academic_year" TEXT NOT NULL DEFAULT '2026-2027',
    "student_count" INTEGER NOT NULL DEFAULT 0,
    "has_groups" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "class_group_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "roster_code" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "gender" TEXT NOT NULL DEFAULT 'M',
    "birth_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ELIGIBLE',
    "group" TEXT DEFAULT '1-guruh',
    "emaktab_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "grade_level" INTEGER NOT NULL,
    "target_group" TEXT DEFAULT 'all',
    "duration_minutes" INTEGER NOT NULL DEFAULT 45,
    "total_questions" INTEGER NOT NULL DEFAULT 15,
    "max_score" DOUBLE PRECISION NOT NULL DEFAULT 40.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "question_number" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "options_json" TEXT NOT NULL,
    "correct_option_id" TEXT NOT NULL,
    "bloom_level" TEXT NOT NULL DEFAULT 'KNOWLEDGE',
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "points" DOUBLE PRECISION NOT NULL DEFAULT 2.5,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_attempts" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),
    "answers_json" TEXT NOT NULL DEFAULT '{}',
    "time_spent_seconds" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'in_progress',

    CONSTRAINT "assessment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_results" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "max_score" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "grade" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'verified',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "details_json" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "grade_levels" TEXT NOT NULL DEFAULT '5,6,7,8,9,10,11',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_resources" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "subject_code" TEXT NOT NULL,
    "grade_level" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL DEFAULT 1,
    "lesson_number" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "description" TEXT,
    "content_json" TEXT NOT NULL DEFAULT '{}',
    "file_url" TEXT,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "curriculum_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_solutions" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "variant_number" INTEGER NOT NULL DEFAULT 1,
    "step_by_step_solution" TEXT NOT NULL,
    "solution_formulas" TEXT,
    "rubric_criteria_json" TEXT NOT NULL DEFAULT '[]',
    "author_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_solutions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "students_roster_code_key" ON "students"("roster_code");

-- CreateIndex
CREATE UNIQUE INDEX "assessments_code_key" ON "assessments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_results_attempt_id_key" ON "assessment_results"("attempt_id");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_tenant_id_code_key" ON "subjects"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "curriculum_resources_tenant_id_subject_code_grade_level_qua_idx" ON "curriculum_resources"("tenant_id", "subject_code", "grade_level", "quarter");

-- CreateIndex
CREATE INDEX "assessment_solutions_assessment_id_question_id_idx" ON "assessment_solutions"("assessment_id", "question_id");

-- AddForeignKey
ALTER TABLE "schools" ADD CONSTRAINT "schools_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_groups" ADD CONSTRAINT "class_groups_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_groups" ADD CONSTRAINT "class_groups_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_class_group_id_fkey" FOREIGN KEY ("class_group_id") REFERENCES "class_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "assessment_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_resources" ADD CONSTRAINT "curriculum_resources_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

