/*
 Navicat Premium Dump SQL

 Source Server         : MySQL
 Source Server Type    : MySQL
 Source Server Version : 80407 (8.4.7)
 Source Host           : localhost:3306
 Source Schema         : vetcloud

 Target Server Type    : MySQL
 Target Server Version : 80407 (8.4.7)
 File Encoding         : 65001

 Date: 01/06/2026 12:11:55
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for password_resets
-- ----------------------------
DROP TABLE IF EXISTS `password_resets`;
CREATE TABLE `password_resets`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `otp` varchar(10) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = latin1 COLLATE = latin1_swedish_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of password_resets
-- ----------------------------

-- ----------------------------
-- Table structure for pet_owner_profiles
-- ----------------------------
DROP TABLE IF EXISTS `pet_owner_profiles`;
CREATE TABLE `pet_owner_profiles`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` int NULL DEFAULT NULL,
  `firstName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `lastName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `farmName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `farmSize` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `bio` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `street` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `state` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `zip` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `owner_id`(`owner_id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of pet_owner_profiles
-- ----------------------------
INSERT INTO `pet_owner_profiles` VALUES (4, 9, 'janith', 'kamal', '', '', 'hello friends', 'mahathanna', 'muttettuwegama', 'pambahinna', '244234', 'Sri Lanka');
INSERT INTO `pet_owner_profiles` VALUES (3, 8, 'john', 'Deo', 'jonnyyyy', '12hec', 'hiii jonnyyy', 'mahathanna', 'muttettuwegama', 'pambahinna', '244234', 'srilanka');

-- ----------------------------
-- Table structure for pet_owners
-- ----------------------------
DROP TABLE IF EXISTS `pet_owners`;
CREATE TABLE `pet_owners`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `fullName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `contact_No` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `numberOfAnimals` int NULL DEFAULT 0,
  `isEmailVerified` tinyint(1) NULL DEFAULT 0,
  `is_Active` tinyint(1) NULL DEFAULT 0,
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '/default.jpg',
  `provider` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT 'local',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `email`(`email` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of pet_owners
-- ----------------------------
INSERT INTO `pet_owners` VALUES (8, 'john@gmail.com', '$2b$11$behPTM5MoIHs1TWtF8vl2OCNGLi2OqaExTR4HH6hV159n.vlj3zg2', 'john Deo', '0786565435', 'mahathanna, muttettuwegama, pambahinna, 244234, srilanka', -1, 0, 0, '/default.jpg', 'local');
INSERT INTO `pet_owners` VALUES (9, 'navindu@gmail.com', '$2b$11$m54JeydAul2ZCB9wo4YWqezBLsmHgzjLJ7ulMt67n66zWosalP2y.', 'janith kamal', '0766543232', 'mahathanna, muttettuwegama, pambahinna, 244234, Sri Lanka', 6, 0, 0, '/default.jpg', 'local');

-- ----------------------------
-- Table structure for veterinarian_profiles
-- ----------------------------
DROP TABLE IF EXISTS `veterinarian_profiles`;
CREATE TABLE `veterinarian_profiles`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `vet_id` int NULL DEFAULT NULL,
  `firstName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `lastName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `clinicName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `bio` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `vet_id`(`vet_id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of veterinarian_profiles
-- ----------------------------
INSERT INTO `veterinarian_profiles` VALUES (2, 5, 'kasun', 'kalhara', '', '');

-- ----------------------------
-- Table structure for veterinarians
-- ----------------------------
DROP TABLE IF EXISTS `veterinarians`;
CREATE TABLE `veterinarians`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `fullName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `contact_No` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `license_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `specialization` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `years_of_experience` int NULL DEFAULT 0,
  `consultation_fee` decimal(10, 2) NOT NULL,
  `isEmailVerified` tinyint(1) NULL DEFAULT 0,
  `is_Active` tinyint(1) NULL DEFAULT 0,
  `image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '/default.jpg',
  `provider` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT 'local',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `email`(`email` ASC) USING BTREE,
  UNIQUE INDEX `license_number`(`license_number` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of veterinarians
-- ----------------------------
INSERT INTO `veterinarians` VALUES (1, 'kavee@gmail.com', '$2b$11$AUWl2wOGyK1EyUY6uNtYteDNsbkJZaXhY91CNdfVPeowhXmeXt55O', 'hemalsha', '0987676546', '34uihjdfhdf', 'large', 3, 0.09, 0, 0, '/default.jpg', 'local');
INSERT INTO `veterinarians` VALUES (5, 'kasun@gmail.com', '$2b$11$KOZkqdqAhlStBcGC5d/aEO.p5/T7X8dbWgI3mwYHyISKVhMv8dIOq', 'kasun kalhara', '0766543434', 'jhhghjg66', 'large', 6, 6.99, 0, 0, '/default.jpg', 'local');

SET FOREIGN_KEY_CHECKS = 1;
