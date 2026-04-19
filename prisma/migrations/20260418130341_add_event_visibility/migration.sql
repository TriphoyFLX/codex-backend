-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'SCHOOL',
    "school_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Event_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Event_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("created_at", "created_by", "date", "description", "id", "image_url", "school_id", "title") SELECT "created_at", "created_by", "date", "description", "id", "image_url", "school_id", "title" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE INDEX "Event_school_id_idx" ON "Event"("school_id");
CREATE INDEX "Event_date_idx" ON "Event"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
