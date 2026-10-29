-- Synchronisation du schéma avec les modèles actuels : cette migration
-- rattrape les changements qui n'avaient jamais été générés en migration.
-- DropForeignKey
ALTER TABLE `Cycle` DROP FOREIGN KEY `Cycle_schoolLevelId_fkey`;

-- DropForeignKey
ALTER TABLE `Class` DROP FOREIGN KEY `Class_cycleId_fkey`;

-- DropForeignKey
ALTER TABLE `UserRole` DROP FOREIGN KEY `UserRole_userId_fkey`;

-- DropForeignKey
ALTER TABLE `UserRole` DROP FOREIGN KEY `UserRole_roleId_fkey`;

-- DropIndex
DROP INDEX `Cycle_schoolLevelId_idx` ON `Cycle`;

-- DropIndex
DROP INDEX `Cycle_schoolLevelId_code_key` ON `Cycle`;

-- DropIndex
DROP INDEX `Class_cycleId_idx` ON `Class`;

-- DropIndex
DROP INDEX `Class_cycleId_code_key` ON `Class`;

-- AlterTable
ALTER TABLE `Establishment` ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `poBox` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Cycle` DROP COLUMN `schoolLevelId`,
    ADD COLUMN `sectionId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Class` DROP COLUMN `cycleId`,
    ADD COLUMN `classroomId` INTEGER NULL,
    ADD COLUMN `gradeLevelId` INTEGER NOT NULL,
    ADD COLUMN `mainTeacherId` INTEGER NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `roleId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `StudentParent` MODIFY `relationType` ENUM('FATHER', 'MOTHER', 'STEPFATHER', 'STEPMOTHER', 'SELF', 'OTHER') NOT NULL;

-- AlterTable
ALTER TABLE `Enrollment` MODIFY `status` ENUM('PENDING', 'ACTIVE', 'TRANSFERRED', 'WITHDRAWN', 'GRADUATED', 'REPEATING') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `Evaluation` ADD COLUMN `examPaperName` VARCHAR(191) NULL,
    ADD COLUMN `examPaperPath` VARCHAR(191) NULL,
    ADD COLUMN `sequenceId` INTEGER NULL,
    ADD COLUMN `validatedAt` DATETIME(3) NULL,
    ADD COLUMN `validatedById` INTEGER NULL;

-- DropTable
DROP TABLE `UserRole`;

-- CreateTable
CREATE TABLE `Sequence` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `periodId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Sequence_periodId_idx`(`periodId`),
    UNIQUE INDEX `Sequence_periodId_order_key`(`periodId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Section` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `schoolLevelId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `language` ENUM('FRANCOPHONE', 'ANGLOPHONE') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Section_schoolLevelId_idx`(`schoolLevelId`),
    UNIQUE INDEX `Section_schoolLevelId_language_key`(`schoolLevelId`, `language`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GradeLevel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cycleId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GradeLevel_cycleId_idx`(`cycleId`),
    UNIQUE INDEX `GradeLevel_cycleId_code_key`(`cycleId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EvaluationReview` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `evaluationId` INTEGER NOT NULL,
    `authorId` INTEGER NOT NULL,
    `decision` ENUM('APPROVED', 'CHANGES_REQUESTED') NOT NULL,
    `comment` TEXT NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EvaluationReview_evaluationId_idx`(`evaluationId`),
    INDEX `EvaluationReview_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `type` ENUM('GENERAL', 'EVALUATION_REVIEW', 'DISCIPLINE', 'REPORT_CARD', 'CONVOCATION') NOT NULL DEFAULT 'GENERAL',
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `link` VARCHAR(191) NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_readAt_idx`(`userId`, `readAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransportRoute` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `establishmentId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `fee` DECIMAL(10, 2) NOT NULL,
    `feeTypeId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TransportRoute_establishmentId_idx`(`establishmentId`),
    INDEX `TransportRoute_feeTypeId_idx`(`feeTypeId`),
    UNIQUE INDEX `TransportRoute_establishmentId_code_key`(`establishmentId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransportSubscription` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `routeId` INTEGER NOT NULL,
    `academicYearId` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NULL,
    `pickupPoint` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TransportSubscription_routeId_idx`(`routeId`),
    INDEX `TransportSubscription_academicYearId_idx`(`academicYearId`),
    UNIQUE INDEX `TransportSubscription_studentId_academicYearId_key`(`studentId`, `academicYearId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Cycle_sectionId_idx` ON `Cycle`(`sectionId`);

-- CreateIndex
CREATE UNIQUE INDEX `Cycle_sectionId_code_key` ON `Cycle`(`sectionId`, `code`);

-- CreateIndex
CREATE UNIQUE INDEX `Class_classroomId_key` ON `Class`(`classroomId`);

-- CreateIndex
CREATE INDEX `Class_gradeLevelId_idx` ON `Class`(`gradeLevelId`);

-- CreateIndex
CREATE INDEX `Class_mainTeacherId_idx` ON `Class`(`mainTeacherId`);

-- CreateIndex
CREATE UNIQUE INDEX `Class_gradeLevelId_code_key` ON `Class`(`gradeLevelId`, `code`);

-- CreateIndex
CREATE INDEX `User_roleId_idx` ON `User`(`roleId`);

-- CreateIndex
CREATE INDEX `Evaluation_sequenceId_idx` ON `Evaluation`(`sequenceId`);

-- AddForeignKey
ALTER TABLE `Sequence` ADD CONSTRAINT `Sequence_periodId_fkey` FOREIGN KEY (`periodId`) REFERENCES `Period`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Section` ADD CONSTRAINT `Section_schoolLevelId_fkey` FOREIGN KEY (`schoolLevelId`) REFERENCES `SchoolLevel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cycle` ADD CONSTRAINT `Cycle_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `Section`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GradeLevel` ADD CONSTRAINT `GradeLevel_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `Cycle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Class` ADD CONSTRAINT `Class_gradeLevelId_fkey` FOREIGN KEY (`gradeLevelId`) REFERENCES `GradeLevel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Class` ADD CONSTRAINT `Class_classroomId_fkey` FOREIGN KEY (`classroomId`) REFERENCES `Classroom`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Class` ADD CONSTRAINT `Class_mainTeacherId_fkey` FOREIGN KEY (`mainTeacherId`) REFERENCES `Teacher`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Evaluation` ADD CONSTRAINT `Evaluation_sequenceId_fkey` FOREIGN KEY (`sequenceId`) REFERENCES `Sequence`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Evaluation` ADD CONSTRAINT `Evaluation_validatedById_fkey` FOREIGN KEY (`validatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvaluationReview` ADD CONSTRAINT `EvaluationReview_evaluationId_fkey` FOREIGN KEY (`evaluationId`) REFERENCES `Evaluation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EvaluationReview` ADD CONSTRAINT `EvaluationReview_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransportRoute` ADD CONSTRAINT `TransportRoute_establishmentId_fkey` FOREIGN KEY (`establishmentId`) REFERENCES `Establishment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransportRoute` ADD CONSTRAINT `TransportRoute_feeTypeId_fkey` FOREIGN KEY (`feeTypeId`) REFERENCES `FeeType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransportSubscription` ADD CONSTRAINT `TransportSubscription_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransportSubscription` ADD CONSTRAINT `TransportSubscription_routeId_fkey` FOREIGN KEY (`routeId`) REFERENCES `TransportRoute`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransportSubscription` ADD CONSTRAINT `TransportSubscription_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `AcademicYear`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
