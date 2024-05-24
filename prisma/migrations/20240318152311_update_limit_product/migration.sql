/*
  Warnings:

  - A unique constraint covering the columns `[branch_master_id,product_id,branch_id]` on the table `limit_product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `product_type_id` to the `limit_product` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "limit_product" DROP CONSTRAINT "limit_product_branch_id_fkey";

-- DropIndex
DROP INDEX "limit_product_product_id_branch_id_key";

-- AlterTable
ALTER TABLE "limit_product" ADD COLUMN     "product_type_id" INTEGER NOT NULL,
ALTER COLUMN "branch_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "limit_product_branch_master_id_product_id_branch_id_key" ON "limit_product"("branch_master_id", "product_id", "branch_id");

-- AddForeignKey
ALTER TABLE "limit_product" ADD CONSTRAINT "limit_product_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
