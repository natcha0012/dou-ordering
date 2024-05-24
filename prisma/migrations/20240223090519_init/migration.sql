-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "token_version" BIGINT NOT NULL DEFAULT 0,
    "tel_no" TEXT,
    "branch_master_id" INTEGER,
    "branch_id" INTEGER,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_master" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "branch_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "branch_master_id" INTEGER NOT NULL,

    CONSTRAINT "branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(20,2) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "map_branch_product" (
    "id" BIGSERIAL NOT NULL,
    "amount" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "product_name" TEXT NOT NULL,
    "limit" INTEGER,
    "branch_master_id" INTEGER NOT NULL,
    "branch_id" INTEGER,

    CONSTRAINT "map_branch_product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order" (
    "id" BIGSERIAL NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "branch_master_id" INTEGER NOT NULL,
    "order_detail" JSONB[],
    "status" TEXT NOT NULL,
    "balance" DECIMAL(20,2) NOT NULL,
    "remark" TEXT,
    "deliver_id" INTEGER,
    "packing_id" INTEGER,
    "queue_status" VARCHAR(20),

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock" (
    "id" BIGSERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "today_in" INTEGER NOT NULL,
    "today_out" INTEGER NOT NULL,
    "ready_to_pack" INTEGER NOT NULL,
    "stock_balance" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "product_name" TEXT NOT NULL,
    "branch_master_id" INTEGER NOT NULL,

    CONSTRAINT "stock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE INDEX "user_role_idx" ON "user"("role");

-- CreateIndex
CREATE UNIQUE INDEX "branch_master_name_key" ON "branch_master"("name");

-- CreateIndex
CREATE UNIQUE INDEX "branch_name_key" ON "branch"("name");

-- CreateIndex
CREATE INDEX "branch_branch_master_id_idx" ON "branch"("branch_master_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_name_key" ON "product"("name");

-- CreateIndex
CREATE INDEX "map_branch_product_branch_id_amount_idx" ON "map_branch_product"("branch_id", "amount" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "map_branch_product_product_id_branch_id_key" ON "map_branch_product"("product_id", "branch_id");

-- CreateIndex
CREATE INDEX "order_branch_master_id_branch_id_status_idx" ON "order"("branch_master_id", "branch_id", "status");

-- CreateIndex
CREATE INDEX "order_branch_id_status_idx" ON "order"("branch_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "stock_branch_master_id_date_product_id_key" ON "stock"("branch_master_id", "date" DESC, "product_id");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_branch_master_id_fkey" FOREIGN KEY ("branch_master_id") REFERENCES "branch_master"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch" ADD CONSTRAINT "branch_branch_master_id_fkey" FOREIGN KEY ("branch_master_id") REFERENCES "branch_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_branch_product" ADD CONSTRAINT "map_branch_product_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_branch_product" ADD CONSTRAINT "map_branch_product_branch_master_id_fkey" FOREIGN KEY ("branch_master_id") REFERENCES "branch_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "map_branch_product" ADD CONSTRAINT "map_branch_product_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_branch_master_id_fkey" FOREIGN KEY ("branch_master_id") REFERENCES "branch_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_deliver_id_fkey" FOREIGN KEY ("deliver_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_packing_id_fkey" FOREIGN KEY ("packing_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_branch_master_id_fkey" FOREIGN KEY ("branch_master_id") REFERENCES "branch_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
