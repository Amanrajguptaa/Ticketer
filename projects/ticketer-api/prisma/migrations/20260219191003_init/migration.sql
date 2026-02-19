-- CreateEnum
CREATE TYPE "Role" AS ENUM ('organizer', 'student', 'gate');

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "organizerAddress" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "venue" TEXT NOT NULL,
    "ticketSupply" INTEGER NOT NULL,
    "priceAlgo" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "appId" BIGINT,
    "appAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "buyerAddress" TEXT NOT NULL,
    "assetId" BIGINT,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_walletAddress_key" ON "user_profiles"("walletAddress");

-- CreateIndex
CREATE INDEX "tickets_buyerAddress_idx" ON "tickets"("buyerAddress");

-- CreateIndex
CREATE INDEX "tickets_eventId_idx" ON "tickets"("eventId");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
