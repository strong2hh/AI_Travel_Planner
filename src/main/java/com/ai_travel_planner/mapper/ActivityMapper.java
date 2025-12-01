package com.ai_travel_planner.mapper;

import com.ai_travel_planner.DTO.ActivityDTO;
import com.ai_travel_planner.entity.Activity;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ActivityMapper {

    void insert(Activity activity);
}
