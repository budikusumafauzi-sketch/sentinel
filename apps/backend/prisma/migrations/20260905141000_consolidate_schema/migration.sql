-- AlterEnum
ALTER TYPE "ScanStatus" ADD VALUE IF NOT EXISTS 'PARTIAL';

-- AlterEnum
ALTER TYPE "FindingCategory" ADD VALUE IF NOT EXISTS 'DEVICE';
ALTER TYPE "FindingCategory" ADD VALUE IF NOT EXISTS 'APPLICATIONS';
ALTER TYPE "FindingCategory" ADD VALUE IF NOT EXISTS 'ACCOUNTS';

-- AlterTable
ALTER TABLE "scans" ADD COLUMN IF NOT EXISTS "score" INTEGER;
ALTER TABLE "scans" ADD COLUMN IF NOT EXISTS "evaluated_controls" INTEGER;
ALTER TABLE "scans" ADD COLUMN IF NOT EXISTS "unavailable_checks" INTEGER;
ALTER TABLE "scans" ADD COLUMN IF NOT EXISTS "report" JSONB;
ALTER TABLE "scans" ADD COLUMN IF NOT EXISTS "raw_evidence" JSONB;
ALTER TABLE "scans" ADD COLUMN IF NOT EXISTS "capabilities" JSONB;

-- AlterTable
ALTER TABLE "findings" ADD COLUMN IF NOT EXISTS "device_id" TEXT;
ALTER TABLE "findings" ADD COLUMN IF NOT EXISTS "fingerprint" TEXT;
ALTER TABLE "findings" ADD COLUMN IF NOT EXISTS "rule_id" TEXT;
ALTER TABLE "findings" ADD COLUMN IF NOT EXISTS "ruleset_version" TEXT;
ALTER TABLE "findings" ADD COLUMN IF NOT EXISTS "risk_score" INTEGER;
ALTER TABLE "findings" ADD COLUMN IF NOT EXISTS "priority" TEXT;

-- AlterTable
ALTER TABLE "security_scores" ADD COLUMN IF NOT EXISTS "scan_id" TEXT;
ALTER TABLE "security_scores" ADD COLUMN IF NOT EXISTS "score_version" TEXT;
ALTER TABLE "security_scores" ADD COLUMN IF NOT EXISTS "risk_model_version" TEXT;
ALTER TABLE "security_scores" ADD COLUMN IF NOT EXISTS "ruleset_version" TEXT;
ALTER TABLE "security_scores" ADD COLUMN IF NOT EXISTS "evaluated_control_count" INTEGER;
ALTER TABLE "security_scores" ADD COLUMN IF NOT EXISTS "unavailable_check_count" INTEGER;
ALTER TABLE "security_scores" ADD COLUMN IF NOT EXISTS "finding_contributions" JSONB;

-- AlterTable
ALTER TABLE "recommendations" ADD COLUMN IF NOT EXISTS "device_id" TEXT;
ALTER TABLE "recommendations" ADD COLUMN IF NOT EXISTS "finding_fingerprint" TEXT;
ALTER TABLE "recommendations" ADD COLUMN IF NOT EXISTS "category" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "security_histories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "scan_id" TEXT NOT NULL,
    "overall_score" INTEGER,
    "category_scores" JSONB,
    "finding_counts" JSONB,
    "evaluated_controls" INTEGER NOT NULL DEFAULT 0,
    "unavailable_checks" INTEGER NOT NULL DEFAULT 0,
    "coverage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "trend" TEXT NOT NULL DEFAULT 'INITIAL',
    "score_delta" INTEGER,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "security_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "scan_id" TEXT,
    "finding_fingerprint" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "FindingSeverity",
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "findings_device_id_idx" ON "findings"("device_id");
CREATE INDEX IF NOT EXISTS "findings_fingerprint_idx" ON "findings"("fingerprint");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "security_scores_scan_id_idx" ON "security_scores"("scan_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "recommendations_device_id_idx" ON "recommendations"("device_id");
CREATE INDEX IF NOT EXISTS "recommendations_finding_fingerprint_idx" ON "recommendations"("finding_fingerprint");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "security_histories_user_id_idx" ON "security_histories"("user_id");
CREATE INDEX IF NOT EXISTS "security_histories_device_id_idx" ON "security_histories"("device_id");
CREATE INDEX IF NOT EXISTS "security_histories_scan_id_idx" ON "security_histories"("scan_id");
CREATE INDEX IF NOT EXISTS "security_histories_recorded_at_idx" ON "security_histories"("recorded_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "security_events_user_id_idx" ON "security_events"("user_id");
CREATE INDEX IF NOT EXISTS "security_events_device_id_idx" ON "security_events"("device_id");
CREATE INDEX IF NOT EXISTS "security_events_scan_id_idx" ON "security_events"("scan_id");
CREATE INDEX IF NOT EXISTS "security_events_created_at_idx" ON "security_events"("created_at");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'security_scores_scan_id_fkey') THEN
    ALTER TABLE "security_scores" ADD CONSTRAINT "security_scores_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "scans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'security_histories_user_id_fkey') THEN
    ALTER TABLE "security_histories" ADD CONSTRAINT "security_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'security_histories_device_id_fkey') THEN
    ALTER TABLE "security_histories" ADD CONSTRAINT "security_histories_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'security_histories_scan_id_fkey') THEN
    ALTER TABLE "security_histories" ADD CONSTRAINT "security_histories_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "scans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'security_events_user_id_fkey') THEN
    ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'security_events_device_id_fkey') THEN
    ALTER TABLE "security_events" ADD CONSTRAINT "security_events_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'security_events_scan_id_fkey') THEN
    ALTER TABLE "security_events" ADD CONSTRAINT "security_events_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "scans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
