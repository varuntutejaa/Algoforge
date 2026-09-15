-- AlterTable
ALTER TABLE "users" ADD COLUMN     "github_connected_at" TIMESTAMP(3),
ADD COLUMN     "github_repo" TEXT,
ADD COLUMN     "github_sync_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "github_token" TEXT,
ADD COLUMN     "github_username" TEXT;
