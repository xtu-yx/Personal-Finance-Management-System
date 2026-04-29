package com.example.finance.service;

import com.example.finance.entity.Budget;
import java.util.List;
import java.util.Map;

public interface BudgetService {
    Budget setBudget(Budget budget);
    List<Map<String, Object>> getBudgetsWithProgress(Long userId, String month);
    void deleteBudget(Long id);
    boolean checkOverBudget(Long userId, String category, String month);
}