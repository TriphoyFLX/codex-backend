-- CreateTable
CREATE TABLE "LessonProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stage_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" DATETIME,
    CONSTRAINT "LessonProgress_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "CourseStage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LessonProgress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "LessonProgress_stage_id_idx" ON "LessonProgress"("stage_id");

-- CreateIndex
CREATE INDEX "LessonProgress_user_id_idx" ON "LessonProgress"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "LessonProgress_stage_id_user_id_key" ON "LessonProgress"("stage_id", "user_id");
