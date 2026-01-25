-- DropIndex
DROP INDEX "QueueItem_userId_position_key";

-- DropIndex
DROP INDEX "QueueItem_userId_idx";

-- CreateIndex
CREATE INDEX "QueueItem_userId_position_idx" ON "QueueItem"("userId", "position");
