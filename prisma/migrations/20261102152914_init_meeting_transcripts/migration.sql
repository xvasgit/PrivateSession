-- CreateTable
CREATE TABLE "MeetingSession" (
    "id" SERIAL NOT NULL,
    "sessionCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranscriptSegment" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "contentCiphertext" BYTEA NOT NULL,
    "iv" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranscriptSegment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MeetingSession_sessionCode_key" ON "MeetingSession"("sessionCode");

-- CreateIndex
CREATE UNIQUE INDEX "TranscriptSegment_sessionId_sequence_key" ON "TranscriptSegment"("sessionId", "sequence");

-- AddForeignKey
ALTER TABLE "TranscriptSegment" ADD CONSTRAINT "TranscriptSegment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MeetingSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
