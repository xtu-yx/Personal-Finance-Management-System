package com.example.finance.controller;

import com.example.finance.common.Result;
import com.example.finance.service.BudgetService;
import com.example.finance.service.RecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final RecordService recordService;
    private final BudgetService budgetService;

    // 仪表盘数据聚合：GET /api/dashboard?userId=1
    @GetMapping
    public Result<Map<String, Object>> dashboard(@RequestParam Long userId) {
        // 1. 自动获取当前年月，格式如 "2026-05"
        String currentMonth = LocalDate.now().toString().substring(0, 7);

        Map<String, Object> result = new HashMap<>();

        // 2. 获取当月收支汇总
        Map<String, Object> summary = recordService.monthlySummary(userId, currentMonth);
        result.put("summary", summary);

        // 3. 获取近期10条账单
        result.put("recentRecords", recordService.page(userId, 1, 10, null, null).getRecords());

        // 4. 获取预算进度概览
        result.put("budgets", budgetService.getBudgetsWithProgress(userId, currentMonth));

        return Result.success(result);
    }
}