package com.ai_travel_planner.mapper;

import com.ai_travel_planner.DTO.ActivityDTO;
import com.ai_travel_planner.entity.Activity;
import com.ai_travel_planner.entity.Schedule;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface ActivityMapper {

    void insert(Activity activity);

    List<Activity> getActivityByDay(Schedule schedule, Integer day);
}
