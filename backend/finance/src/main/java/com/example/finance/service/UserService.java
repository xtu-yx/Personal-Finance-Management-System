package com.example.finance.service;

import com.example.finance.entity.User;

public interface UserService {
    // 用户注册
    User register(String username, String password, String email);

    // 用户登录
    User login(String username, String password);

    // 根据ID查询用户
    User getById(Long id);
}