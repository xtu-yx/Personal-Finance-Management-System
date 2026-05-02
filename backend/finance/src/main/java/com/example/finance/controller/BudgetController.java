package com.example.finance.controller;

import com.example.finance.common.Result;
import com.example.finance.entity.Budget;
import com.example.finance.service.BudgetService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/budget")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    @PostMapping
    public Result<Budget> setBudget(@RequestBody Budget budget) {
        Budget saved = budgetService.setBudget(budget);
        return Result.success("预算设置成功", saved);
    }

    @GetMapping
    public Result<List<Map<String, Object>>> getBudgets(@RequestParam Long userId,
                                                        @RequestParam String month) {
        List<Map<String, Object>> budgets = budgetService.getBudgetsWithProgress(userId, month);
        return Result.success(budgets);
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteBudget(@PathVariable Long id) {
        budgetService.deleteBudget(id);
        return Result.success("删除成功", null);
    }
}