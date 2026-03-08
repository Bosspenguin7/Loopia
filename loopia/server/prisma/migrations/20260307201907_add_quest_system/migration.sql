-- CreateTable
CREATE TABLE "Quest" (
    "id" SERIAL NOT NULL,
    "questKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "npcName" TEXT NOT NULL,
    "sceneKey" TEXT NOT NULL,
    "questType" TEXT NOT NULL,
    "loopiReward" INTEGER NOT NULL DEFAULT 0,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "requiresReview" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestCompletion" (
    "id" SERIAL NOT NULL,
    "guestId" INTEGER NOT NULL,
    "questId" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestSubmission" (
    "id" SERIAL NOT NULL,
    "guestId" INTEGER NOT NULL,
    "questId" INTEGER NOT NULL,
    "linkUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,

    CONSTRAINT "QuestSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestStreak" (
    "id" SERIAL NOT NULL,
    "guestId" INTEGER NOT NULL,
    "questId" INTEGER NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastCompletedAt" TIMESTAMP(3),
    "badgeEarned" BOOLEAN NOT NULL DEFAULT false,
    "badgeEarnedAt" TIMESTAMP(3),

    CONSTRAINT "QuestStreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FishInventory" (
    "id" SERIAL NOT NULL,
    "guestId" INTEGER NOT NULL,
    "fishType" TEXT NOT NULL DEFAULT 'salmon',
    "quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FishInventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Quest_questKey_key" ON "Quest"("questKey");

-- CreateIndex
CREATE INDEX "QuestCompletion_guestId_questId_completedAt_idx" ON "QuestCompletion"("guestId", "questId", "completedAt");

-- CreateIndex
CREATE INDEX "QuestSubmission_status_idx" ON "QuestSubmission"("status");

-- CreateIndex
CREATE INDEX "QuestSubmission_guestId_questId_idx" ON "QuestSubmission"("guestId", "questId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestStreak_guestId_questId_key" ON "QuestStreak"("guestId", "questId");

-- CreateIndex
CREATE UNIQUE INDEX "FishInventory_guestId_fishType_key" ON "FishInventory"("guestId", "fishType");

-- AddForeignKey
ALTER TABLE "QuestCompletion" ADD CONSTRAINT "QuestCompletion_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestCompletion" ADD CONSTRAINT "QuestCompletion_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestSubmission" ADD CONSTRAINT "QuestSubmission_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestSubmission" ADD CONSTRAINT "QuestSubmission_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestStreak" ADD CONSTRAINT "QuestStreak_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestStreak" ADD CONSTRAINT "QuestStreak_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FishInventory" ADD CONSTRAINT "FishInventory_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
