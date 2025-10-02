/*
  Warnings:

  - You are about to drop the column `position` on the `QueueItem` table. All the data in the column will be lost.
  - Added the required column `shufflePosition` to the `QueueItem` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_QueueItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "songId" INTEGER NOT NULL,
    "shufflePosition" INTEGER NOT NULL,
    "originalPosition" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QueueItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QueueItem_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_QueueItem" ("createdAt", "id", "originalPosition", "songId", "updatedAt", "userId") SELECT "createdAt", "id", "originalPosition", "songId", "updatedAt", "userId" FROM "QueueItem";
DROP TABLE "QueueItem";
ALTER TABLE "new_QueueItem" RENAME TO "QueueItem";
CREATE INDEX "QueueItem_userId_shufflePosition_idx" ON "QueueItem"("userId", "shufflePosition");
CREATE UNIQUE INDEX "QueueItem_userId_songId_key" ON "QueueItem"("userId", "songId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
