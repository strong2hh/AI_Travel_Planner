package com.ai_travel_planner.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalTime;

/**
 * 活动数据传输对象 (Activity DTO)
 * 用于封装单个活动信息，是 ScheduleDTO 的子元素。
 */
@Data // 包含 @Getter, @Setter, @ToString, @EqualsAndHashCode
@NoArgsConstructor // 无参构造函数
@AllArgsConstructor // 全参构造函数
public class ActivityDTO {

    private String place;

    private LocalTime startTime;

    private LocalTime endTime;

    private String description;

}