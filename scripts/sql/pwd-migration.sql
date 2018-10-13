ALTER TABLE `ytradio`.`users` 
ADD COLUMN `Algorithm` ENUM('sha256', 'sha512', 'argon2') NOT NULL DEFAULT 'sha256' COMMENT '' AFTER `Password`;
