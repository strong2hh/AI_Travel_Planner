package com.ai_travel_planner.controller;

import com.ai_travel_planner.DTO.ScheduleDTO;
import com.ai_travel_planner.result.Result;
import com.ai_travel_planner.service.ScheduleService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/schedule")
@Slf4j
@CrossOrigin(origins = "*")
public class ScheduleController {

    @Autowired
    private  ScheduleService scheduleService;

    /**
     * 获取最近的一次行程安排数据
     * @return 包含行程安排数据的响应
     */
    @GetMapping("/getSchedule")
    public Result<ScheduleDTO> getScheduleData() {
        log.info("获取最近的一次行程安排数据");
        ScheduleDTO scheduleDTO = scheduleService.getSchdule();

        if(scheduleDTO == null) {
            return Result.error("scheduleDTO == null");
        }
        return Result.success(scheduleDTO);
    }

}
