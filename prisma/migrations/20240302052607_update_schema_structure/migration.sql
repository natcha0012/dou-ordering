/*
  Warnings:

  - You are about to drop the column `limit` on the `map_branch_product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "map_branch_product" DROP COLUMN "limit",
ADD COLUMN     "all_time_amount" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "date" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "limit_product" (
    "id" SERIAL NOT NULL,
    "limit" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "product_name" TEXT NOT NULL,
    "branch_master_id" INTEGER NOT NULL,
    "branch_id" INTEGER NOT NULL,

    CONSTRAINT "limit_product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "limit_product_product_id_branch_id_key" ON "limit_product"("product_id", "branch_id");

-- AddForeignKey
ALTER TABLE "limit_product" ADD CONSTRAINT "limit_product_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "limit_product" ADD CONSTRAINT "limit_product_branch_master_id_fkey" FOREIGN KEY ("branch_master_id") REFERENCES "branch_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "limit_product" ADD CONSTRAINT "limit_product_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
