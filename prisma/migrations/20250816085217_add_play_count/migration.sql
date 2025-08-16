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
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Song" ("album", "artist", "cover", "createdAt", "duration", "fileHash", "filePath", "id", "lyrics", "title", "updatedAt") SELECT "album", "artist", "cover", "createdAt", "duration", "fileHash", "filePath", "id", "lyrics", "title", "updatedAt" FROM "Song";
DROP TABLE "Song";
ALTER TABLE "new_Song" RENAME TO "Song";
CREATE UNIQUE INDEX "Song_filePath_fileHash_key" ON "Song"("filePath", "fileHash");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
