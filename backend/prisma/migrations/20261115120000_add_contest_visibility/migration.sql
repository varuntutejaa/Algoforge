-- AlterTable
-- Additive with a default, so existing contests stay public and the
-- previously deployed API keeps working until the new one ships.
ALTER TABLE "contests" ADD COLUMN     "is_private" BOOLEAN NOT NULL DEFAULT false;
