/*
Navicat MySQL Data Transfer

Source Server         : localhost
Source Server Version : 50508
Source Host           : 127.0.0.1:3306
Source Database       : vetcloud

Target Server Type    : MYSQL
Target Server Version : 50508
File Encoding         : 65001

Date: 2026-05-27 22:50:20
*/

SET FOREIGN_KEY_CHECKS=0;

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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=latin1;

-- ----------------------------
-- Records of password_resets
-- ----------------------------
INSERT INTO `password_resets` VALUES ('1', 'navindualahakoon3@gmail.com', '577525', '2026-05-27 17:56:19', '2026-05-27 17:46:19');
INSERT INTO `password_resets` VALUES ('2', 'navindualahakoon3@gmail.com', '143902', '2026-05-27 17:57:20', '2026-05-27 17:47:20');
INSERT INTO `password_resets` VALUES ('3', 'navindualahakoon3@gmail.com', '175765', '2026-05-27 18:06:52', '2026-05-27 17:56:52');
INSERT INTO `password_resets` VALUES ('4', 'navindualahakoon3@gmail.com', '303561', '2026-05-27 18:10:33', '2026-05-27 18:00:33');
INSERT INTO `password_resets` VALUES ('5', 'navindualahakoon3@gmail.com', '773104', '2026-05-27 18:10:40', '2026-05-27 18:00:40');
INSERT INTO `password_resets` VALUES ('6', 'navindualahakoon3@gmail.com', '651151', '2026-05-27 18:15:16', '2026-05-27 18:05:16');
INSERT INTO `password_resets` VALUES ('7', 'navindualahakoon3@gmail.com', '203932', '2026-05-27 18:19:23', '2026-05-27 18:09:24');
INSERT INTO `password_resets` VALUES ('8', 'navindualahakoon3@gmail.com', '945542', '2026-05-27 18:58:40', '2026-05-27 18:48:40');
INSERT INTO `password_resets` VALUES ('9', 'navindualahakoon3@gmail.com', '279609', '2026-05-27 19:03:11', '2026-05-27 18:53:11');
INSERT INTO `password_resets` VALUES ('10', 'navindualahakoon3@gmail.com', '260192', '2026-05-27 22:26:23', '2026-05-27 22:16:23');
INSERT INTO `password_resets` VALUES ('11', 'navindualahakoon3@gmail.com', '462765', '2026-05-27 22:30:56', '2026-05-27 22:20:56');
INSERT INTO `password_resets` VALUES ('12', 'navindualahakoon3@gmail.com', '509191', '2026-05-27 22:32:03', '2026-05-27 22:22:03');

-- ----------------------------
-- Table structure for pet_owners
-- ----------------------------
DROP TABLE IF EXISTS `pet_owners`;
CREATE TABLE `pet_owners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(191) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `fullName` varchar(100) NOT NULL,
  `contact_No` varchar(15) NOT NULL,
  `address` text,
  `numberOfAnimals` int(11) DEFAULT '0',
  `isEmailVerified` tinyint(1) DEFAULT '0',
  `is_Active` tinyint(1) DEFAULT '0',
  `image` varchar(255) DEFAULT '/default.jpg',
  `provider` varchar(50) DEFAULT 'local',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of pet_owners
-- ----------------------------
INSERT INTO `pet_owners` VALUES ('1', 'hemalsha@gmail.com', '$2b$11$U.3XQhYgqu8P93X4huwTbex/53pBbWYt8OS8wqoirTnWYEN/2tTV.', 'fgfgdgf', '0768766787', 'hhhhhhhhhhhhhhhhhh', '9', '0', '0', '/default.jpg', 'local');
INSERT INTO `pet_owners` VALUES ('5', 'navindu@gmail.com', '$2b$11$Mau.vqYby4KMGbYoSZ8i3OYK.lHmLTx7wpPXsCMotozRbYKdJnvcK', 'Navindu Alahakoon', '0713251661', 'example address', '4', '0', '0', '/default.jpg', 'local');
INSERT INTO `pet_owners` VALUES ('6', 'navindualahakoon3@gmail.com', '$2b$11$oX1nYo2eITavAHar1d8HieK6PEV68P9d11/RhgZQaYWyNbK47vDlO', 'Navindu Alahakoon', '0753963717', '131/A, Kandy road, Kurunegala', '2', '0', '0', '/default.jpg', 'local');

-- ----------------------------
-- Table structure for veterinarians
-- ----------------------------
DROP TABLE IF EXISTS `veterinarians`;
CREATE TABLE `veterinarians` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(191) NOT NULL,
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
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `license_number` (`license_number`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Records of veterinarians
-- ----------------------------
INSERT INTO `veterinarians` VALUES ('1', 'kavee@gmail.com', '$2b$11$AUWl2wOGyK1EyUY6uNtYteDNsbkJZaXhY91CNdfVPeowhXmeXt55O', 'hemalsha', '0987676546', '34uihjdfhdf', 'large', '3', '0.09', '0', '0', '/default.jpg', 'local');
