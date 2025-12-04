package com.ai_travel_planner.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * 对应数据库 TripDays 表的实体类
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Schedule {

    private Long scheduleId;

    private Long userId;

    private String theme;

    private Integer dayNumber;

}