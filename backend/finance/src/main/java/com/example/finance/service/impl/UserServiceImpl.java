package com.example.finance.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.finance.entity.User;
import com.example.finance.mapper.UserMapper;
import com.example.finance.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service // 关键：标记这是一个Service层组件，交给Spring管理
@RequiredArgsConstructor // 关键：Lombok注解，自动生成带final参数的构造函数（替代@Autowired）
public class UserServiceImpl implements UserService {

    // 注入依赖（注意：必须用final，配合@RequiredArgsConstructor）
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder; // 这个是我们之前在config里配置的BCrypt加密器

    @Override
    public User register(String username, String password, String email) {
        // 1. 检查用户名是否已被注册
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, username); // 等价于 SQL: WHERE username = ?
        if (userMapper.selectCount(wrapper) > 0) {
            throw new IllegalArgumentException("用户名已存在"); // 抛出异常，后面Controller会处理
        }

        // 2. 创建用户对象，密码加密后存储
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password)); // 【核心】BCrypt加密，永远不存明文密码
        user.setEmail(email);

        // 3. 插入数据库（MyBatis-Plus提供的方法）
        userMapper.insert(user);
        return user;
    }

    @Override
    public User login(String username, String password) {
        // 1. 根据用户名查询用户
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, username);
        User user = userMapper.selectOne(wrapper);

        // 2. 判断用户是否存在
        if (user == null) {
            throw new IllegalArgumentException("用户名或密码错误");
        }

        // 3. 【核心】BCrypt密码比对（matches方法会自动处理盐值）
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("用户名或密码错误");
        }

        return user;
    }

    @Override
    public User getById(Long id) {
        // 直接调用MyBatis-Plus提供的根据ID查询方法
        return userMapper.selectById(id);
    }
}