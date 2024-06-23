-- AlterTable
ALTER TABLE "order" ADD COLUMN     "created_by" INTEGER;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
