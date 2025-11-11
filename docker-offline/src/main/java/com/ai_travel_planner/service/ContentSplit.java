package com.ai_travel_planner.service;

import java.util.Map;
import java.util.List;

public interface ContentSplit {
    
    /**
     * 从文本中提取时间地点信息
     * @param text 输入的文本内容
     * @return 包含按天分组的时间地点信息，格式为：{"DAY1": [{"time": "08:00", "place": "天安门"}, ...], "DAY2": [...]}
     */
    Map<String, List<TimePlacePair>> timeAndPlaceExtraction(String text);
    
    /**
     * 时间地点对类
     */
    class TimePlacePair {
        private String time;
        private String place;
        
        public TimePlacePair(String time, String place) {
            this.time = time;
            this.place = place;
        }
        
        public String getTime() {
            return time;
        }
        
        public String getPlace() {
            return place;
        }
        
        @Override
        public String toString() {
            return "TimePlacePair{time='" + time + "', place='" + place + "'}";
        }
    }
}
