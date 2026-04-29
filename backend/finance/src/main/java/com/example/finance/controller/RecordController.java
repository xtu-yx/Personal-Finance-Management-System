package com.example.finance.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.example.finance.common.Result;
import com.example.finance.entity.Record;
import com.example.finance.service.RecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/records")
@RequiredArgsConstructor
public class RecordController {

    private final RecordService recordService;

    // 添加记录: POST /api/records
    @PostMapping
    public Result<Record> add(@RequestBody Record record) {
        if (record.getUserId() == null) {
            return Result.error(400, "用户ID不能为空");
        }
        if (record.getAmount() == null || record.getAmount().doubleValue() <= 0) {
            return Result.error(400, "金额必须大于0");
        }
        Record saved = recordService.add(record);
        return Result.success("添加成功", saved);
    }

    // 分页查询记录: GET /api/records?page=1&size=10&month=2026-04&category=餐饮
    @GetMapping
    public Result<Page<Record>> page(@RequestParam Long userId,
                                     @RequestParam(defaultValue = "1") Integer page,
                                     @RequestParam(defaultValue = "10") Integer size,
                                     @RequestParam(required = false) String month,
                                     @RequestParam(required = false) String category) {
        Page<Record> result = recordService.page(userId, page, size, month, category);
        return Result.success(result);
    }

    // 修改记录: PUT /api/records/{id}
    @PutMapping("/{id}")
    public Result<Record> update(@PathVariable Long id, @RequestBody Record record) {
        record.setId(id);
        Record updated = recordService.update(record);
        return Result.success("修改成功", updated);
    }

    // 删除记录: DELETE /api/records/{id}
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        recordService.delete(id);
        return Result.success("删除成功", null);
    }
}