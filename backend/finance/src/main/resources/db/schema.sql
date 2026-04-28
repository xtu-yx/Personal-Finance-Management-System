CREATE DATABASE IF NOT EXISTS personal_finance
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE personal_finance;

DROP TABLE IF EXISTS `record`;
DROP TABLE IF EXISTS `budget`;
DROP TABLE IF EXISTS `user`;
DROP TABLE IF EXISTS `category`;

CREATE TABLE `user` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键，自增',
    `username`    VARCHAR(50)  NOT NULL COMMENT '用户名，唯一',
    `password`    VARCHAR(255) NOT NULL COMMENT 'BCrypt加密密码',
    `email`       VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
    `create_time` DATETIME     DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
    `update_time` DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

CREATE TABLE `record` (
    `id`          BIGINT         NOT NULL AUTO_INCREMENT COMMENT '主键，自增',
    `user_id`     BIGINT         NOT NULL COMMENT '外键，关联用户',
    `type`        VARCHAR(10)    NOT NULL COMMENT '类型：income（收入）/ expense（支出）',
    `amount`      DECIMAL(10,2)  NOT NULL COMMENT '金额',
    `category`    VARCHAR(50)    NOT NULL COMMENT '分类',
    `remark`      VARCHAR(255)   DEFAULT NULL COMMENT '备注',
    `record_date` DATE           NOT NULL COMMENT '记账日期',
    `create_time` DATETIME       DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_record_date` (`record_date`),
    KEY `idx_user_date` (`user_id`, `record_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收支记录表';

CREATE TABLE `budget` (
    `id`          BIGINT         NOT NULL AUTO_INCREMENT COMMENT '主键，自增',
    `user_id`     BIGINT         NOT NULL COMMENT '外键，关联用户',
    `category`    VARCHAR(50)    NOT NULL COMMENT '预算分类',
    `amount`      DECIMAL(10,2)  NOT NULL COMMENT '预算金额',
    `month`       VARCHAR(7)     NOT NULL COMMENT '预算月份（如：2026-04）',
    `create_time` DATETIME       DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_month` (`user_id`, `month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预算表';

CREATE TABLE `category` (
    `id`   INT          NOT NULL AUTO_INCREMENT COMMENT '主键，自增',
    `name` VARCHAR(50)  NOT NULL COMMENT '分类名称',
    `type` VARCHAR(10)  NOT NULL COMMENT '所属类型（income / expense）',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分类表';

INSERT INTO `category` (`name`, `type`) VALUES
('工资', 'income'),
('奖金', 'income'),
('投资收益', 'income'),
('兼职收入', 'income'),
('其他收入', 'income'),
('餐饮', 'expense'),
('购物', 'expense'),
('交通', 'expense'),
('住房', 'expense'),
('娱乐', 'expense'),
('医疗', 'expense'),
('教育', 'expense'),
('通讯', 'expense'),
('其他支出', 'expense');