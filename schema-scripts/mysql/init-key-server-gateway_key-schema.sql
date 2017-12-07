DROP SCHEMA IF EXISTS `gateway_key`;
CREATE SCHEMA `gateway_key`;
USE `gateway_key`;

DROP TABLE IF EXISTS `id_key`;
CREATE TABLE `id_key` (
    `id` int NOT NULL AUTO_INCREMENT,
    `workspaceId` VARCHAR(36) NOT NULL,
    `subjectType` VARCHAR(9) NOT NULL,
    `subject` VARCHAR(36) NOT NULL,
    `safeKeyHash` VARCHAR(32) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `id_key_identity_index` (`workspaceId`,`subjectType`,`subject`),
    INDEX `id_key_safekeyhash_index` (`safeKeyHash`)
);

DROP TABLE IF EXISTS `api_key`;
CREATE TABLE `api_key` (
	`id` int NOT NULL AUTO_INCREMENT,
    `workspaceId` VARCHAR(36) NOT NULL,
    `appId` VARCHAR(36) NOT NULL,
    `clientId` VARCHAR(36) NOT NULL,
    `safeKeyHash` VARCHAR(32) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `api_key_identity_index` (`workspaceId`,`appId`,`clientId`),
    INDEX `api_key_safekeyhash_index` (`safeKeyHash`)
);