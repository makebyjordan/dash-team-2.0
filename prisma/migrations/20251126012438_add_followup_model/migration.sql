-- CreateEnum
CREATE TYPE "FollowupSection" AS ENUM ('urgent', 'list', 'calendar', 'checks');

-- CreateTable
CREATE TABLE "Followup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "contactCompany" TEXT,
    "section" "FollowupSection" NOT NULL,
    "notes" TEXT,
    "dueDate" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Followup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Followup_userId_idx" ON "Followup"("userId");

-- CreateIndex
CREATE INDEX "Followup_section_idx" ON "Followup"("section");

-- CreateIndex
CREATE INDEX "Followup_completed_idx" ON "Followup"("completed");

-- AddForeignKey
ALTER TABLE "Followup" ADD CONSTRAINT "Followup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
