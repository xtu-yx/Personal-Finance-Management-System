package com.example.finance.controller;

import com.example.finance.common.Result;
import com.example.finance.entity.User;
import com.example.finance.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // 用户注册: POST /api/user/register
    @PostMapping("/register")
    public Result<User> register(@RequestBody Map<String, String> params) {
        String username = params.get("username");
        String password = params.get("password");
        String email = params.get("email");

        // 参数校验
        if (username == null || username.trim().isEmpty()) {
            return Result.error(400, "用户名不能为空");
        }
        if (password == null || password.length() < 6) {
            return Result.error(400, "密码长度不能少于6位");
        }

        User user = userService.register(username, password, email);
        user.setPassword(null);  // 不返回密码
        return Result.success("注册成功", user);
    }

    // 用户登录: POST /api/user/login
    @PostMapping("/login")
    public Result<User> login(@RequestBody Map<String, String> params) {
        String username = params.get("username");
        String password = params.get("password");

        User user = userService.login(username, password);
        user.setPassword(null);  // 不返回密码
        return Result.success("登录成功", user);
    }

    // 获取当前用户信息: GET /api/user/info
    @GetMapping("/info")
    public Result<User> getUserInfo(@RequestParam Long userId) {
        User user = userService.getById(userId);
        if (user == null) {
            return Result.error(404, "用户不存在");
        }
        user.setPassword(null);
        return Result.success(user);
    }
}