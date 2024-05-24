/*
  Warnings:

  - A unique constraint covering the columns `[branch_id,product_id,date]` on the table `map_branch_product` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "map_branch_product_branch_id_amount_idx";

-- DropIndex
DROP INDEX "map_branch_product_product_id_branch_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "map_branch_product_branch_id_product_id_date_key" ON "map_branch_product"("branch_id", "product_id", "date" DESC);
