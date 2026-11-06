ALTER TABLE "MeetingSession"
ADD COLUMN "reviewCiphertext" BYTEA,
ADD COLUMN "reviewIv" BYTEA;
ALTER TABLE "MeetingSession" ADD CONSTRAINT "MeetingSession_review_pair_check"
CHECK (("reviewCiphertext" IS NULL AND "reviewIv" IS NULL)
    OR ("reviewCiphertext" IS NOT NULL AND "reviewIv" IS NOT NULL
        AND octet_length("reviewIv") = 12 AND octet_length("reviewCiphertext") >= 16));
