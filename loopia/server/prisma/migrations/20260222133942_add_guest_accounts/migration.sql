-- AlterTable
ALTER TABLE "PlayerSession" ADD COLUMN     "guestId" INTEGER;

-- CreateTable
CREATE TABLE "GuestAccount" (
    "id" SERIAL NOT NULL,
    "guestToken" TEXT NOT NULL,
    "displayName" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuestAccount_guestToken_key" ON "GuestAccount"("guestToken");

-- CreateIndex
CREATE INDEX "GuestAccount_guestToken_idx" ON "GuestAccount"("guestToken");

-- CreateIndex
CREATE INDEX "PlayerSession_guestId_idx" ON "PlayerSession"("guestId");

-- AddForeignKey
ALTER TABLE "PlayerSession" ADD CONSTRAINT "PlayerSession_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "GuestAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
