/*
  Warnings:

  - You are about to drop the column `iamge` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "iamge",
ADD COLUMN     "image" TEXT[] DEFAULT ARRAY[]::TEXT[];
