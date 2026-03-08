-- AlterTable
ALTER TABLE "GuestAccount" ADD COLUMN     "credits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "duckets" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastLoginRewardAt" TIMESTAMP(3),
ADD COLUMN     "loginStreak" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CurrencyTransaction" (
    "id" SERIAL NOT NULL,
    "guestId" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "sourceId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CurrencyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CurrencyTransaction_guestId_createdAt_idx" ON "CurrencyTransaction"("guestId", "createdAt");

-- CreateIndex
CREATE INDEX "CurrencyTransaction_guestId_currency_idx" ON "CurrencyTransaction"("guestId", "currency");

-- AddForeignKey
ALTER TABLE "CurrencyTransaction" ADD CONSTRAINT "CurrencyTransaction_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "GuestAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrencyTransaction" ADD CONSTRAINT "CurrencyTransaction_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "GuestAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
