-- CreateTable
CREATE TABLE "CourseEnrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "course_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "CourseEnrollment_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CourseEnrollment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CourseChat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enrollment_id" TEXT NOT NULL,
    CONSTRAINT "CourseChat_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "CourseEnrollment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CourseMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chat_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CourseMessage_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "CourseChat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CourseMessage_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CourseEnrollment_course_id_idx" ON "CourseEnrollment"("course_id");

-- CreateIndex
CREATE INDEX "CourseEnrollment_user_id_idx" ON "CourseEnrollment"("user_id");

-- CreateIndex
CREATE INDEX "CourseEnrollment_status_idx" ON "CourseEnrollment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CourseEnrollment_course_id_user_id_key" ON "CourseEnrollment"("course_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "CourseChat_enrollment_id_key" ON "CourseChat"("enrollment_id");

-- CreateIndex
CREATE INDEX "CourseMessage_chat_id_idx" ON "CourseMessage"("chat_id");

-- CreateIndex
CREATE INDEX "CourseMessage_sender_id_idx" ON "CourseMessage"("sender_id");
