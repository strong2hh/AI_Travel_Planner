package com.ai_travel_planner.service;

import com.ai_travel_planner.DTO.ScheduleDTO;
import org.springframework.stereotype.Service;

@Service
public interface ScheduleService {
    /**
     * 插入日程数据
     * @param scheduleDTO
     */
    void insertSchedule(ScheduleDTO scheduleDTO);

    /**
     * 获取最近的一次行程安排数据
     * @return
     */
    ScheduleDTO getSchdule();
}
