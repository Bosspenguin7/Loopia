-- AlterTable
ALTER TABLE "GuestAccount" ADD COLUMN     "authMethod" TEXT NOT NULL DEFAULT 'guest',
ADD COLUMN     "encryptedKey" TEXT,
ADD COLUMN     "twitterAvatar" TEXT,
ADD COLUMN     "twitterId" TEXT,
ADD COLUMN     "twitterUsername" TEXT,
ADD COLUMN     "walletAddress" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "GuestAccount_twitterId_key" ON "GuestAccount"("twitterId");

-- CreateIndex
CREATE UNIQUE INDEX "GuestAccount_walletAddress_key" ON "GuestAccount"("walletAddress");

-- CreateIndex
CREATE INDEX "GuestAccount_twitterId_idx" ON "GuestAccount"("twitterId");
