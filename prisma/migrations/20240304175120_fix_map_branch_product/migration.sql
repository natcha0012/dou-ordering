/*
  Warnings:

  - A unique constraint covering the columns `[branch_master_id,branch_id,product_id,date]` on the table `map_branch_product` will be added. If there are existing duplicate values, this will fail.
  - Made the column `branch_id` on table `map_branch_product` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "map_branch_product" DROP CONSTRAINT "map_branch_product_branch_id_fkey";

-- DropIndex
DROP INDEX "map_branch_product_branch_id_product_id_date_key";

-- AlterTable
ALTER TABLE "map_branch_product" ALTER COLUMN "branch_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "map_branch_product_branch_master_id_branch_id_product_id_da_key" ON "map_branch_product"("branch_master_id", "branch_id", "product_id", "date" DESC);

-- AddForeignKey
ALTER TABLE "map_branch_product" ADD CONSTRAINT "map_branch_product_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
