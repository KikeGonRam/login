-- AlterTable
ALTER TABLE `user` MODIFY `status` ENUM('PENDING_ACTIVATION', 'ACTIVE', 'BLOCKED', 'DISABLED') NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE `ActivationToken` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ActivationToken_email_key`(`email`),
    UNIQUE INDEX `ActivationToken_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
