/*
  Warnings:

  - You are about to drop the `ProcessedStripeEvent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "ProcessedStripeEvent";

-- CreateTable
CREATE TABLE "processed_stripe_events" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_stripe_events_pkey" PRIMARY KEY ("id")
);
