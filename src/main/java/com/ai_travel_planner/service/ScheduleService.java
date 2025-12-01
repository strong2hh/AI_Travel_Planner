package com.ai_travel_planner.service;

import com.ai_travel_planner.DTO.ScheduleDTO;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public interface ScheduleService {
    /**
     * 插入日程数据
     * @param schedules
     */
    void insertSchedule(List<ScheduleDTO> schedules);
}
