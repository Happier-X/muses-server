/*
  Warnings:

  - You are about to drop the `QueueItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "QueueItem";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "PlayQueue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "songId" INTEGER NOT NULL,
    "shufflePosition" INTEGER NOT NULL,
    "originalPosition" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlayQueue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlayQueue_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PlayQueue_userId_shufflePosition_idx" ON "PlayQueue"("userId", "shufflePosition");

-- CreateIndex
CREATE UNIQUE INDEX "PlayQueue_userId_songId_key" ON "PlayQueue"("userId", "songId");
