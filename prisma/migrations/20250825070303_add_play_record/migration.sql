/*
  Warnings:

  - You are about to drop the column `playCount` on the `Song` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,songId]` on the table `QueueItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "PlayRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "songId" INTEGER NOT NULL,
    "playCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlayRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlayRecord_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Song" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "album" TEXT NOT NULL,
    "lyrics" JSONB NOT NULL,
    "cover" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Song" ("album", "artist", "cover", "createdAt", "duration", "fileHash", "filePath", "id", "lyrics", "title", "updatedAt") SELECT "album", "artist", "cover", "createdAt", "duration", "fileHash", "filePath", "id", "lyrics", "title", "updatedAt" FROM "Song";
DROP TABLE "Song";
ALTER TABLE "new_Song" RENAME TO "Song";
CREATE UNIQUE INDEX "Song_filePath_fileHash_key" ON "Song"("filePath", "fileHash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PlayRecord_userId_songId_key" ON "PlayRecord"("userId", "songId");

-- CreateIndex
CREATE UNIQUE INDEX "QueueItem_userId_songId_key" ON "QueueItem"("userId", "songId");
