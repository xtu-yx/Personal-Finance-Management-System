package com.example.finance.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.example.finance.entity.Budget;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import java.util.List;

@Mapper
public interface BudgetMapper extends BaseMapper<Budget> {

    // 按月份和用户查询所有预算
    @Select("SELECT * FROM budget WHERE user_id = #{userId} AND month = #{month}")
    List<Budget> selectByUserAndMonth(@Param("userId") Long userId,
                                      @Param("month") String month);
}