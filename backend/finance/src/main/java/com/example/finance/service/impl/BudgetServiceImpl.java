package com.example.finance.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.finance.entity.Budget;
import com.example.finance.mapper.BudgetMapper;
import com.example.finance.mapper.RecordMapper;
import com.example.finance.service.BudgetService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
@RequiredArgsConstructor
public class BudgetServiceImpl implements BudgetService {

    private final BudgetMapper budgetMapper;
    private final RecordMapper recordMapper;

    @Override
    public Budget setBudget(Budget budget) {
        LambdaQueryWrapper<Budget> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Budget::getUserId, budget.getUserId())
                .eq(Budget::getCategory, budget.getCategory())
                .eq(Budget::getMonth, budget.getMonth());
        Budget existing = budgetMapper.selectOne(wrapper);

        if (existing != null) {
            existing.setAmount(budget.getAmount());
            budgetMapper.updateById(existing);
            return existing;
        } else {
            budgetMapper.insert(budget);
            return budget;
        }
    }

    @Override
    public List<Map<String, Object>> getBudgetsWithProgress(Long userId, String month) {
        List<Budget> budgets = budgetMapper.selectByUserAndMonth(userId, month);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Budget budget : budgets) {
            BigDecimal spent = recordMapper.getCategorySpent(
                    userId, budget.getCategory(), month);

            BigDecimal progress = BigDecimal.ZERO;
            if (budget.getAmount().compareTo(BigDecimal.ZERO) > 0) {
                progress = spent
                        .divide(budget.getAmount(), 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal("100"));
            }

            Map<String, Object> item = new HashMap<>();
            item.put("id", budget.getId());
            item.put("category", budget.getCategory());
            item.put("budgetAmount", budget.getAmount());
            item.put("spent", spent);
            item.put("progress", progress.setScale(2, RoundingMode.HALF_UP));
            item.put("overBudget", spent.compareTo(budget.getAmount()) > 0);
            result.add(item);
        }
        return result;
    }

    @Override
    public void deleteBudget(Long id) {
        budgetMapper.deleteById(id);
    }

    @Override
    public boolean checkOverBudget(Long userId, String category, String month) {
        LambdaQueryWrapper<Budget> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Budget::getUserId, userId)
                .eq(Budget::getCategory, category)
                .eq(Budget::getMonth, month);
        Budget budget = budgetMapper.selectOne(wrapper);

        if (budget == null) {
            return false;
        }

        BigDecimal spent = recordMapper.getCategorySpent(userId, category, month);
        return spent.compareTo(budget.getAmount()) > 0;
    }
}