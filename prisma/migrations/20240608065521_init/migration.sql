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
    "productTypeId" INTEGER NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_type" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "product_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order" (
    "id" BIGSERIAL NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "branch_name" TEXT NOT NULL DEFAULT 'branch1',
    "branch_master_id" INTEGER NOT NULL,
    "order_detail" JSONB[],
    "actual_product" JSONB[],
    "status" TEXT NOT NULL,
    "created_at" BIGINT NOT NULL DEFAULT 0,
    "updated_at" BIGINT NOT NULL DEFAULT 0,
    "remark" TEXT,
    "deliver_id" INTEGER,
    "packing_id" INTEGER,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "product_type_name_key" ON "product_type"("name");

-- CreateIndex
CREATE INDEX "order_branch_master_id_branch_id_status_idx" ON "order"("branch_master_id", "branch_id", "status");

-- CreateIndex
CREATE INDEX "order_branch_id_status_idx" ON "order"("branch_id", "status");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_branch_master_id_fkey" FOREIGN KEY ("branch_master_id") REFERENCES "branch_master"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch" ADD CONSTRAINT "branch_branch_master_id_fkey" FOREIGN KEY ("branch_master_id") REFERENCES "branch_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_productTypeId_fkey" FOREIGN KEY ("productTypeId") REFERENCES "product_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_branch_master_id_fkey" FOREIGN KEY ("branch_master_id") REFERENCES "branch_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_deliver_id_fkey" FOREIGN KEY ("deliver_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_packing_id_fkey" FOREIGN KEY ("packing_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
