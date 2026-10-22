-- =============================================================================
-- Smart Pet Tracking and Escape Prediction System
-- Universal Database Schema (MySQL 5.5, 5.7, 8.0+ Compatible)
-- Department of Data Science - Anurag University
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `smart_pet_tracking` 
CHARACTER SET utf8 
COLLATE utf8_unicode_ci;

USE `smart_pet_tracking`;

-- -----------------------------------------------------------------------------
-- Table: users
-- Stores authenticated application users (pet owners/researchers)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(120) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `created_at` DATETIME NULL,
    `updated_at` DATETIME NULL,
    INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: pets
-- Stores registered pets belonging to users
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pets` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `species` VARCHAR(50) NOT NULL, -- Dog, Cat, etc.
    `breed` VARCHAR(100) NULL,
    `age` INT NULL,
    `gender` VARCHAR(20) NULL,      -- Male, Female
    `photo_url` VARCHAR(500) NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN DEFAULT 1,
    `created_at` DATETIME NULL,
    `updated_at` DATETIME NULL,
    CONSTRAINT `fk_pets_user` FOREIGN KEY (`user_id`) 
        REFERENCES `users` (`id`) ON DELETE CASCADE,
    INDEX `idx_pets_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: safe_zones
-- Stores geofence boundary configuration (center point + radius) per pet
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `safe_zones` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `pet_id` INT NOT NULL UNIQUE,
    `center_latitude` DECIMAL(10, 8) NOT NULL,
    `center_longitude` DECIMAL(11, 8) NOT NULL,
    `radius_meters` DECIMAL(8, 2) NOT NULL DEFAULT 100.00,
    `is_active` BOOLEAN DEFAULT 1,
    `created_at` DATETIME NULL,
    `updated_at` DATETIME NULL,
    CONSTRAINT `fk_safezones_pet` FOREIGN KEY (`pet_id`) 
        REFERENCES `pets` (`id`) ON DELETE CASCADE,
    INDEX `idx_safezones_pet_id` (`pet_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: pet_locations
-- Movement log and real-time/simulated GPS coordinates
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pet_locations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `pet_id` INT NOT NULL,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `distance_from_center` DECIMAL(8, 2) NOT NULL,
    `is_inside` BOOLEAN NOT NULL,
    `is_simulated` BOOLEAN DEFAULT 1,
    `timestamp` DATETIME NULL,
    CONSTRAINT `fk_locations_pet` FOREIGN KEY (`pet_id`) 
        REFERENCES `pets` (`id`) ON DELETE CASCADE,
    INDEX `idx_locations_pet_time` (`pet_id`, `timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: alerts
-- Escape incidents and boundary violation notifications
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `alerts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `pet_id` INT NOT NULL,
    `alert_type` VARCHAR(50) NOT NULL DEFAULT 'ESCAPE',
    `message` TEXT NOT NULL,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `distance_from_center` DECIMAL(8, 2) NOT NULL,
    `is_read` BOOLEAN DEFAULT 0,
    `created_at` DATETIME NULL,
    CONSTRAINT `fk_alerts_pet` FOREIGN KEY (`pet_id`) 
        REFERENCES `pets` (`id`) ON DELETE CASCADE,
    INDEX `idx_alerts_pet_read` (`pet_id`, `is_read`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table: risk_assessments
-- Explainable escape-risk predictions computed from movement patterns
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `risk_assessments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `pet_id` INT NOT NULL,
    `risk_score` DECIMAL(5, 2) NOT NULL,
    `risk_level` VARCHAR(25) NOT NULL,
    `factors_json` TEXT NOT NULL,
    `recommendations` TEXT NULL,
    `assessed_at` DATETIME NULL,
    CONSTRAINT `fk_risk_pet` FOREIGN KEY (`pet_id`) 
        REFERENCES `pets` (`id`) ON DELETE CASCADE,
    INDEX `idx_risk_pet_assessed` (`pet_id`, `assessed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
