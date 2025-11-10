package com.ai_travel_planner.service;

import java.util.Map;

public interface ScheduleService {
    
    /**
     * 获取行程安排数据
     * 调用ContentSplit服务来解析行程文本并返回格式化数据
     * 
     * @param scheduleText 行程文本内容
     * @return 格式化后的行程数据，包含按天分组的行程安排
     */
    Map<String, Object> getSchedule(String scheduleText);
}
