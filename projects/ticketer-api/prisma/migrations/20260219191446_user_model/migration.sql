/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `user_profiles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `user_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `user_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `user_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "hobbies" TEXT[],
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_email_key" ON "user_profiles"("email");
