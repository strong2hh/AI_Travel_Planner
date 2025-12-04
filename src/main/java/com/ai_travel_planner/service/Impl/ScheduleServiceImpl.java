package com.ai_travel_planner.service.Impl;

import com.ai_travel_planner.DTO.ActivityDTO;
import com.ai_travel_planner.DTO.DayDTO;
import com.ai_travel_planner.DTO.ScheduleDTO;
import com.ai_travel_planner.constant.BaseContext;
import com.ai_travel_planner.entity.Activity;
import com.ai_travel_planner.entity.Schedule;
import com.ai_travel_planner.mapper.ActivityMapper;
import com.ai_travel_planner.mapper.ScheduleMapper;
import com.ai_travel_planner.result.Result;
import com.ai_travel_planner.service.ScheduleService;
import javafx.concurrent.ScheduledService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

// ScheduleServiceImpl.java

@Service
public class ScheduleServiceImpl implements ScheduleService {

    @Autowired
    private ScheduleMapper scheduleMapper;
    @Autowired
    private ActivityMapper activityMapper;

    // ... (insertSchedule 方法的修复，确保 activity.setDay 使用 dayDTO.getDay()) ...
    public void insertSchedule(ScheduleDTO scheduleDTO) {
        Schedule schedule = new Schedule();
        schedule.setUserId(BaseContext.getCurrentId());
        schedule.setDayNumber(scheduleDTO.getDays().size());
        schedule.setTheme(scheduleDTO.getTheme());
        scheduleMapper.insert(schedule);

        for (DayDTO dayDTO: scheduleDTO.getDays()) {
            for(ActivityDTO activityDTO:dayDTO.getActivities()) {
                Activity activity = new Activity();
                BeanUtils.copyProperties(activityDTO,activity);
                activity.setUserId(BaseContext.getCurrentId());
                activity.setScheduleId(schedule.getScheduleId());
                activity.setDay(dayDTO.getDay()); // 确保设置正确的 day 字段
                activityMapper.insert(activity);
            }
        }
    }


    @Override
    public ScheduleDTO getSchdule() {
        Schedule schedule = scheduleMapper.getLatestSchdule(BaseContext.getCurrentId());

        if (schedule == null) {
            return null; // 返回 null，让前端知道没有数据
        }

        ScheduleDTO scheduleDTO = new ScheduleDTO();
        scheduleDTO.setTheme(schedule.getTheme());

        List<DayDTO> dayDTOs = new ArrayList<>();

        if (schedule.getDayNumber() == null || schedule.getDayNumber() <= 0) {
            return scheduleDTO; // 没有天数，返回空对象
        }

        // 循环应该基于 DayDTO 中的实际 day 字段值，但这里只能根据 DayNumber 循环
        // 假设 day 字段值是 1 到 DayNumber
        for (int dayNumber = 1; dayNumber <= schedule.getDayNumber(); dayNumber++) {
            DayDTO dayDTO = new DayDTO();
            dayDTO.setDay(dayNumber); // 设置天数，从 1, 2, 3... 开始

            // 获取用户一天的所有活动
            List<Activity> activities = activityMapper.getActivityByDay(schedule, dayNumber);

            List<ActivityDTO> activityDTOs = new ArrayList<>();
            for (Activity activity : activities) {
                ActivityDTO activityDTO = new ActivityDTO();
                BeanUtils.copyProperties(activity,activityDTO);
                activityDTOs.add(activityDTO);
            }

            dayDTO.setActivities(activityDTOs);
            dayDTOs.add(dayDTO);
        }

        scheduleDTO.setDays(dayDTOs);
        return scheduleDTO;
    }
}