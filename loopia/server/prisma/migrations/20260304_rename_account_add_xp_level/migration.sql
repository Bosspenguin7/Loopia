-- Rename table
ALTER TABLE "GuestAccount" RENAME TO "Account";

-- Rename indexes (Prisma convention: ModelName_field_key)
ALTER INDEX "GuestAccount_pkey" RENAME TO "Account_pkey";
ALTER INDEX "GuestAccount_guestToken_key" RENAME TO "Account_guestToken_key";
ALTER INDEX "GuestAccount_twitterId_key" RENAME TO "Account_twitterId_key";
ALTER INDEX "GuestAccount_walletAddress_key" RENAME TO "Account_walletAddress_key";
ALTER INDEX "GuestAccount_guestToken_idx" RENAME TO "Account_guestToken_idx";
ALTER INDEX "GuestAccount_twitterId_idx" RENAME TO "Account_twitterId_idx";

-- Add XP/Level columns
ALTER TABLE "Account" ADD COLUMN "xp" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Account" ADD COLUMN "level" INTEGER NOT NULL DEFAULT 1;
