-- AlterTable
ALTER TABLE `devices` ADD COLUMN `ipAddress` VARCHAR(191) NULL,
    ADD COLUMN `manufacturer` VARCHAR(191) NULL,
    ADD COLUMN `model` VARCHAR(191) NULL,
    ADD COLUMN `operatingSystem` VARCHAR(191) NULL;
