-- 确保使用正确的数据库（可选，如果 docker-compose 已经指定了 MYSQL_DATABASE，这里可以省略，但加上更保险）
USE ai_traveller;

-- 1. 创建 employee 表
CREATE TABLE IF NOT EXISTS `employee` (
                                          `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
                                          `username` VARCHAR(100) NOT NULL,
                                          `password` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. 创建 schedule 表
CREATE TABLE IF NOT EXISTS `schedule` (
                                          `schedule_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
                                          `theme` VARCHAR(255),
                                          `user_id` BIGINT,
                                          `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
                                          `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                                          `day_number` INT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. 创建 activity 表
CREATE TABLE IF NOT EXISTS `activity` (
                                          `activity_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                                          `schedule_id` BIGINT,
                                          `user_id` BIGINT UNSIGNED,
                                          `place` VARCHAR(255),
                                          `description` TEXT,
                                          `start_time` TIME,
                                          `end_time` TIME,
                                          `day` INT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;