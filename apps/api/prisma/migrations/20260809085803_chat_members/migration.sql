-- CreateTable
CREATE TABLE "chat_members" (
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_members_pkey" PRIMARY KEY ("roomId","userId")
);

-- CreateIndex
CREATE INDEX "chat_members_userId_idx" ON "chat_members"("userId");

-- AddForeignKey
ALTER TABLE "chat_members" ADD CONSTRAINT "chat_members_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
