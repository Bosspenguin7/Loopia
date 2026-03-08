-- AlterTable
ALTER TABLE "GuestAccount" ADD COLUMN     "respectsReceived" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "RespectLog" (
    "id" SERIAL NOT NULL,
    "giverId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "givenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RespectLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RespectLog_giverId_givenAt_idx" ON "RespectLog"("giverId", "givenAt");

-- CreateIndex
CREATE INDEX "RespectLog_receiverId_idx" ON "RespectLog"("receiverId");

-- AddForeignKey
ALTER TABLE "RespectLog" ADD CONSTRAINT "RespectLog_giverId_fkey" FOREIGN KEY ("giverId") REFERENCES "GuestAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespectLog" ADD CONSTRAINT "RespectLog_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "GuestAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
