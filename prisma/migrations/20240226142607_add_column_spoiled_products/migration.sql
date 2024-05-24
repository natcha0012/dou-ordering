-- AlterTable
ALTER TABLE "order" ADD COLUMN     "spoiled_product" JSONB[];

-- AlterTable
ALTER TABLE "stock" ADD COLUMN     "spoil_product" INTEGER NOT NULL DEFAULT 0;
