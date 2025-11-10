package com.ai_travel_planner.service.Impl;

import com.ai_travel_planner.service.ScheduleService;
import com.ai_travel_planner.service.ContentSplit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class ScheduleServiceImpl implements ScheduleService {
    
    private final ContentSplit contentSplit;
    
    @Override
    public Map<String, Object> getSchedule(String scheduleText) {
        Map<String, Object> result = new LinkedHashMap<>();
        
        try {
            log.info("开始解析行程文本，文本长度: {}", scheduleText.length());
            
            // 调用ContentSplit服务解析文本
            Map<String, List<ContentSplit.TimePlacePair>> scheduleData = contentSplit.timeAndPlaceExtraction(scheduleText);
            
            // 构建返回结果
            result.put("success", true);
            result.put("data", formatScheduleData(scheduleData));
            result.put("message", "行程数据解析成功");
            
            log.info("行程数据解析成功，共解析到 {} 天的行程", scheduleData.size());
            
        } catch (Exception e) {
            log.error("行程数据解析失败: {}", e.getMessage(), e);
            
            result.put("success", false);
            result.put("data", Collections.emptyMap());
            result.put("error", "行程数据解析失败: " + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * 格式化行程数据，转换为前端需要的格式
     */
    private Map<String, Object> formatScheduleData(Map<String, List<ContentSplit.TimePlacePair>> scheduleData) {
        Map<String, Object> formattedData = new LinkedHashMap<>();
        
        for (Map.Entry<String, List<ContentSplit.TimePlacePair>> entry : scheduleData.entrySet()) {
            String dayKey = entry.getKey();
            List<ContentSplit.TimePlacePair> timePlacePairs = entry.getValue();
            
            // 将day1, day2等转换为前端需要的格式
            String formattedDay = convertDayKeyToFrontendFormat(dayKey);
            
            List<Map<String, String>> daySchedule = new ArrayList<>();
            
            // 将时间地点对转换为前端需要的格式
            for (ContentSplit.TimePlacePair pair : timePlacePairs) {
                Map<String, String> scheduleItem = new HashMap<>();
                scheduleItem.put("place", pair.getPlace());
                scheduleItem.put("time", pair.getTime());
                // 生成简短的描述
                scheduleItem.put("description", generateDescription(pair));
                
                daySchedule.add(scheduleItem);
            }
            
            formattedData.put(formattedDay, daySchedule);
        }
        
        return formattedData;
    }
    
    /**
     * 转换天数的键格式，将DAY1转换为day1
     */
    private String convertDayKeyToFrontendFormat(String dayKey) {
        // 将DAY1转换为day1，DAY2转换为day2等
        if (dayKey.startsWith("DAY")) {
            return dayKey.toLowerCase();
        }
        // 如果已经是day1格式，直接返回
        return dayKey;
    }
    
    /**
     * 生成行程描述
     */
    private String generateDescription(ContentSplit.TimePlacePair pair) {
        String time = pair.getTime();
        String place = pair.getPlace();
        
        // 根据时间生成活动描述
        if (time.contains("08") || time.contains("09") || time.contains("10")) {
            return "上午活动：参观" + place;
        } else if (time.contains("11") || time.contains("12") || time.contains("13")) {
            return "午餐时间：在" + place + "用餐";
        } else if (time.contains("14") || time.contains("15") || time.contains("16")) {
            return "下午活动：游览" + place;
        } else if (time.contains("17") || time.contains("18") || time.contains("19")) {
            return "晚餐时间：在" + place + "用餐";
        } else {
            return "在" + place + "活动";
        }
    }
}
