/*
  Warnings:

  - You are about to drop the column `spoil_product` on the `stock` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "stock" DROP COLUMN "spoil_product",
ADD COLUMN     "spoil_amount" INTEGER NOT NULL DEFAULT 0;
