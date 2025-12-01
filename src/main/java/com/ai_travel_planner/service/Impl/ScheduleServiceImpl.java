package com.ai_travel_planner.service.Impl;

import com.ai_travel_planner.DTO.ActivityDTO;
import com.ai_travel_planner.DTO.ScheduleDTO;
import com.ai_travel_planner.constant.BaseContext;
import com.ai_travel_planner.entity.Activity;
import com.ai_travel_planner.entity.Schedule;
import com.ai_travel_planner.mapper.ActivityMapper;
import com.ai_travel_planner.mapper.ScheduleMapper;
import com.ai_travel_planner.service.ScheduleService;
import javafx.concurrent.ScheduledService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ScheduleServiceImpl implements ScheduleService {

    @Autowired
    private ScheduleMapper scheduleMapper;
    @Autowired
    private ActivityMapper activityMapper;

    public void insertSchedule(List<ScheduleDTO> schedules){

        for(ScheduleDTO scheduleDTO:schedules){
            Schedule schedule = new Schedule();
            BeanUtils.copyProperties(scheduleDTO,schedule);
            schedule.setUserId(BaseContext.getCurrentId());
            scheduleMapper.insert(schedule);

            for(ActivityDTO activityDTO:scheduleDTO.getActivities()){
                Activity activity = new Activity();
                BeanUtils.copyProperties(activityDTO,activity);
                activity.setUserId(BaseContext.getCurrentId());
                activity.setDayId(schedule.getDayId());
                activity.setDay(schedule.getDay());
                activityMapper.insert(activity);
            }
        }
    }
}