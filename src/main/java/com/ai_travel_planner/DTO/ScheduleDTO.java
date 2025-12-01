package com.ai_travel_planner.DTO;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

/**
 * 每日日程数据传输对象 (Schedule DTO)
 * 用于和前端交互一整天的行程安排。
 */
@Data // 包含 @Getter, @Setter, @ToString, @EqualsAndHashCode
@NoArgsConstructor // 无参构造函数
@AllArgsConstructor // 全参构造函数
public class ScheduleDTO {
    private String theme;

    private Integer day;

    private List<ActivityDTO> activities;

}