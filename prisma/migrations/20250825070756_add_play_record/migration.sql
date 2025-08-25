-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PlayRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "songId" INTEGER NOT NULL,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlayRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlayRecord_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PlayRecord" ("createdAt", "id", "playCount", "songId", "updatedAt", "userId") SELECT "createdAt", "id", "playCount", "songId", "updatedAt", "userId" FROM "PlayRecord";
DROP TABLE "PlayRecord";
ALTER TABLE "new_PlayRecord" RENAME TO "PlayRecord";
CREATE UNIQUE INDEX "PlayRecord_userId_songId_key" ON "PlayRecord"("userId", "songId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
