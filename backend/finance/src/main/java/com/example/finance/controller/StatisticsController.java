package com.example.finance.controller;

import com.example.finance.common.Result;
import com.example.finance.service.RecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final RecordService recordService;

    @GetMapping("/summary")
    public Result<Map<String, Object>> summary(@RequestParam Long userId,
                                               @RequestParam String month) {
        Map<String, Object> summary = recordService.monthlySummary(userId, month);
        return Result.success(summary);
    }

    @GetMapping("/trend")
    public Result<Map<String, Object>> trend(@RequestParam Long userId,
                                             @RequestParam(defaultValue = "6") Integer months) {
        Map<String, Object> trend = recordService.trendStats(userId, months);
        return Result.success(trend);
    }
}