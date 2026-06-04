/*
Navicat MySQL Data Transfer

Source Server         : localhost
Source Server Version : 50508
Source Host           : 127.0.0.1:3306
Source Database       : vetcloud

Target Server Type    : MYSQL
Target Server Version : 50508
File Encoding         : 65001

Date: 2026-06-04 12:28:37
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for animals
-- ----------------------------
DROP TABLE IF EXISTS `animals`;
CREATE TABLE `animals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `owner_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `species` varchar(50) NOT NULL,
  `breed` varchar(100) NOT NULL,
  `age` varchar(50) NOT NULL,
  `weight` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Healthy',
  `image` text,
  `lastVisit` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for animal_medical_histories
-- ----------------------------
DROP TABLE IF EXISTS `animal_medical_histories`;
CREATE TABLE `animal_medical_histories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `animal_id` int(11) NOT NULL,
  `date` varchar(50) NOT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `vet` varchar(100) NOT NULL,
  `notes` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for password_resets
-- ----------------------------
DROP TABLE IF EXISTS `password_resets`;
CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `otp` varchar(10) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for pet_owners
-- ----------------------------
DROP TABLE IF EXISTS `pet_owners`;
CREATE TABLE `pet_owners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `fullName` varchar(100) NOT NULL,
  `contact_No` varchar(15) NOT NULL,
  `address` text,
  `numberOfAnimals` int(11) DEFAULT '0',
  `isEmailVerified` tinyint(1) DEFAULT '0',
  `is_Active` tinyint(1) DEFAULT '0',
  `image` varchar(255) DEFAULT '/default.jpg',
  `provider` varchar(50) DEFAULT 'local',
  `two_factor_secret` varchar(255) DEFAULT NULL,
  `is_two_factor_enabled` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `email` (`email`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for pet_owner_profiles
-- ----------------------------
DROP TABLE IF EXISTS `pet_owner_profiles`;
CREATE TABLE `pet_owner_profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `owner_id` int(11) DEFAULT NULL,
  `firstName` varchar(100) DEFAULT NULL,
  `lastName` varchar(100) DEFAULT NULL,
  `farmName` varchar(255) DEFAULT NULL,
  `farmSize` varchar(100) DEFAULT NULL,
  `bio` text,
  `street` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `zip` varchar(20) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `owner_id` (`owner_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for user_sessions
-- ----------------------------
DROP TABLE IF EXISTS `user_sessions`;
CREATE TABLE `user_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `user_role` varchar(50) NOT NULL,
  `device` varchar(255) NOT NULL,
  `location` varchar(255) DEFAULT 'Unknown Location',
  `login_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `token` text NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for veterinarians
-- ----------------------------
DROP TABLE IF EXISTS `veterinarians`;
CREATE TABLE `veterinarians` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `fullName` varchar(100) NOT NULL,
  `contact_No` varchar(15) NOT NULL,
  `license_number` varchar(50) NOT NULL,
  `specialization` varchar(50) NOT NULL,
  `years_of_experience` int(11) DEFAULT '0',
  `consultation_fee` decimal(10,2) NOT NULL,
  `isEmailVerified` tinyint(1) DEFAULT '0',
  `is_Active` tinyint(1) DEFAULT '0',
  `image` varchar(255) DEFAULT '/default.jpg',
  `provider` varchar(50) DEFAULT 'local',
  `two_factor_secret` varchar(255) DEFAULT NULL,
  `is_two_factor_enabled` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `email` (`email`) USING BTREE,
  UNIQUE KEY `license_number` (`license_number`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Table structure for veterinarian_profiles
-- ----------------------------
DROP TABLE IF EXISTS `veterinarian_profiles`;
CREATE TABLE `veterinarian_profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vet_id` int(11) DEFAULT NULL,
  `firstName` varchar(100) DEFAULT NULL,
  `lastName` varchar(100) DEFAULT NULL,
  `clinicName` varchar(255) DEFAULT NULL,
  `bio` text,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `vet_id` (`vet_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
