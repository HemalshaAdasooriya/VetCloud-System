/*
 Navicat Premium Dump SQL

 Source Server         : MySQL
 Source Server Type    : MySQL
 Source Server Version : 100432 (10.4.32-MariaDB)
 Source Host           : localhost:3306
 Source Schema         : vetcloud

 Target Server Type    : MySQL
 Target Server Version : 100432 (10.4.32-MariaDB)
 File Encoding         : 65001

 Date: 23/05/2026 10:16:59
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

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
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of pet_owners
-- ----------------------------
INSERT INTO `pet_owners` VALUES (1, 'hemalsha@gmail.com', '$2b$11$U.3XQhYgqu8P93X4huwTbex/53pBbWYt8OS8wqoirTnWYEN/2tTV.', 'fgfgdgf', '0768766787', 'hhhhhhhhhhhhhhhhhh', 9, 0, 0, '/default.jpg', 'local');

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
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of veterinarians
-- ----------------------------
INSERT INTO `veterinarians` VALUES (1, 'kavee@gmail.com', '$2b$11$AUWl2wOGyK1EyUY6uNtYteDNsbkJZaXhY91CNdfVPeowhXmeXt55O', 'hemalsha', '0987676546', '34uihjdfhdf', 'large', 3, 0.09, 0, 0, '/default.jpg', 'local');

SET FOREIGN_KEY_CHECKS = 1;
