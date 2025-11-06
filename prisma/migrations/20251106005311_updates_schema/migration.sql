/*
  Warnings:

  - The `status` column on the `blood_requests` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `donations` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `request_matches` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `recipient_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('OPEN', 'MATCHED', 'FULFILLED', 'EXPIRED');

-- AlterTable
ALTER TABLE "blood_requests" DROP COLUMN "status",
ADD COLUMN     "status" "RequestStatus" NOT NULL DEFAULT 'OPEN';

-- AlterTable
ALTER TABLE "donations" DROP COLUMN "status",
ADD COLUMN     "status" "DonationStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "donor_profiles" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "reputationScore" INTEGER NOT NULL DEFAULT 500,
ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "recipient_profiles" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "preferredDonorTypes" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "request_matches" ADD COLUMN     "availabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "fraudRiskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "responseTimeScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "successRateScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
DROP COLUMN "status",
ADD COLUMN     "status" "MatchStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifier_pool" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "qualificationScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "successfulVerifications" INTEGER NOT NULL DEFAULT 0,
    "disputedVerifications" INTEGER NOT NULL DEFAULT 0,
    "verifierCredential" TEXT,
    "smartContractAddress" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifier_pool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

-- CreateIndex
CREATE UNIQUE INDEX "verifier_pool_userId_key" ON "verifier_pool"("userId");

-- CreateIndex
CREATE INDEX "blood_requests_status_idx" ON "blood_requests"("status");

-- CreateIndex
CREATE INDEX "blood_requests_bloodType_idx" ON "blood_requests"("bloodType");

-- CreateIndex
CREATE INDEX "donations_status_idx" ON "donations"("status");

-- CreateIndex
CREATE INDEX "donor_profiles_bloodType_idx" ON "donor_profiles"("bloodType");

-- CreateIndex
CREATE INDEX "donor_profiles_isAvailable_idx" ON "donor_profiles"("isAvailable");

-- CreateIndex
CREATE INDEX "request_matches_status_idx" ON "request_matches"("status");
