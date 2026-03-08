-- CreateTable
CREATE TABLE "BlockEntry" (
    "id" SERIAL NOT NULL,
    "blockerId" INTEGER NOT NULL,
    "blockedId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlockEntry_blockerId_idx" ON "BlockEntry"("blockerId");

-- CreateIndex
CREATE INDEX "BlockEntry_blockedId_idx" ON "BlockEntry"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockEntry_blockerId_blockedId_key" ON "BlockEntry"("blockerId", "blockedId");

-- AddForeignKey
ALTER TABLE "BlockEntry" ADD CONSTRAINT "BlockEntry_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "GuestAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockEntry" ADD CONSTRAINT "BlockEntry_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "GuestAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
