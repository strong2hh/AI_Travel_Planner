package com.ai_travel_planner.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data // 包含 @Getter, @Setter, @ToString, @EqualsAndHashCode
@NoArgsConstructor // 无参构造函数
@AllArgsConstructor // 全参构造函数
public class DayDTO {

    private Integer day;

    private List<ActivityDTO> activities;
}
