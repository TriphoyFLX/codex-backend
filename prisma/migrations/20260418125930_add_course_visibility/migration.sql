-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'SCHOOL',
    "teacher_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Course_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Course_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Course" ("created_at", "description", "id", "image_url", "school_id", "teacher_id", "title") SELECT "created_at", "description", "id", "image_url", "school_id", "teacher_id", "title" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
CREATE INDEX "Course_teacher_id_idx" ON "Course"("teacher_id");
CREATE INDEX "Course_school_id_idx" ON "Course"("school_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
