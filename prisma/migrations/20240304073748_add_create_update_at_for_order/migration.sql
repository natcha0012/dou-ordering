-- AlterTable
ALTER TABLE "order" ADD COLUMN     "branch_name" TEXT NOT NULL DEFAULT 'branch1',
ADD COLUMN     "created_at" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" BIGINT NOT NULL DEFAULT 0;
