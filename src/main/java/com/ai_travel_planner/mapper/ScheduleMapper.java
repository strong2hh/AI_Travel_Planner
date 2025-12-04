package com.ai_travel_planner.mapper;

import com.ai_travel_planner.DTO.ScheduleDTO;
import com.ai_travel_planner.entity.Schedule;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ScheduleMapper {

    void insert(Schedule schedule);

    Schedule getLatestSchdule(Long userId);
}
