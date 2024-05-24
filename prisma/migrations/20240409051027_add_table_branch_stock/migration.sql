-- CreateTable
CREATE TABLE "branch_stock" (
    "id" SERIAL NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "branch_master_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "product_type_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "branch_stock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branch_stock_branch_id_product_id_key" ON "branch_stock"("branch_id", "product_id");

-- AddForeignKey
ALTER TABLE "branch_stock" ADD CONSTRAINT "branch_stock_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_stock" ADD CONSTRAINT "branch_stock_branch_master_id_fkey" FOREIGN KEY ("branch_master_id") REFERENCES "branch_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_stock" ADD CONSTRAINT "branch_stock_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_stock" ADD CONSTRAINT "branch_stock_product_type_id_fkey" FOREIGN KEY ("product_type_id") REFERENCES "product_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
