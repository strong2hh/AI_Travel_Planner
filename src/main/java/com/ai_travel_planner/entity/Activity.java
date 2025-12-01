package com.ai_travel_planner.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalTime;

/**
 * 对应数据库 Activities 表的实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Activity {

    private Integer activityId;

    private Long userId;

    private Integer dayId;

    private Integer day;

    private String place;

    private String description;

    private LocalTime startTime;

    private LocalTime endTime;
}