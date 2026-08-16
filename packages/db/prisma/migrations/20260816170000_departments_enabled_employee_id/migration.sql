-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "is_enabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "employee_id" VARCHAR(50);

