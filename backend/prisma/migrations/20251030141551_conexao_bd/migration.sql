/*
  Warnings:

  - You are about to drop the `device` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `preventive` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `preventive` DROP FOREIGN KEY `Preventive_deviceId_fkey`;

-- DropTable
DROP TABLE `device`;

-- DropTable
DROP TABLE `preventive`;

-- DropTable
DROP TABLE `user`;

-- CreateTable
CREATE TABLE `devices` (
    `id` VARCHAR(191) NOT NULL,
    `glpiId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `serial` VARCHAR(191) NULL,
    `otherserial` VARCHAR(191) NULL,
    `contact` VARCHAR(191) NULL,
    `comment` VARCHAR(191) NULL,
    `deviceType` VARCHAR(191) NOT NULL,
    `lastSync` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `glpiDateMod` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `maintenanceIntervalDays` INTEGER NOT NULL DEFAULT 90,
    `nextPreventiveDate` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `devices_glpiId_key`(`glpiId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `preventives` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `technician` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `deviceId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `preventives` ADD CONSTRAINT `preventives_deviceId_fkey` FOREIGN KEY (`deviceId`) REFERENCES `devices`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
