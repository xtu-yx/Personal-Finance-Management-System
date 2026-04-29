package com.example.finance.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.finance.entity.Record;
import java.util.Map;

public interface RecordService {
    // 添加收支记录
    Record add(Record record);

    // 修改记录
    Record update(Record record);

    // 删除记录
    void delete(Long id);

    // 分页查询记录（支持按月份、分类筛选）
    Page<Record> page(Long userId, Integer page, Integer size, String month, String category);

    // 月度收支汇总（含支出分类统计，用于仪表盘）
    Map<String, Object> monthlySummary(Long userId, String month);

    // 近N个月收支趋势（用于折线图）
    Map<String, Object> trendStats(Long userId, Integer months);
}