package com.ai_travel_planner.service.Impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class ContentSplitImpl implements ContentSplit {
    
    @Override
    public Map<String, List<TimePlacePair>> timeAndPlaceExtraction(String text) {
        Map<String, List<TimePlacePair>> result = new LinkedHashMap<>();
        
        if (text == null || text.trim().isEmpty()) {
            return result;
        }
        
        // 按天分割文本（根据##分割）
        String[] daySections = splitTextByDayMarkers(text);
        
        for (int i = 0; i < daySections.length; i++) {
            String dayKey = "DAY" + (i + 1);
            List<TimePlacePair> timePlacePairs = extractTimePlacePairsFromMarkers(daySections[i]);
            result.put(dayKey, timePlacePairs);
        }
        
        return result;
    }
    
    /**
     * 按天分割文本
     */
    private String[] splitTextByDays(String text) {
        // 匹配DAY或第几天开头的部分
        Pattern dayPattern = Pattern.compile("(?i)(DAY\\s*\\d+|第\\s*\\d+\\s*天)", Pattern.MULTILINE);
        String[] parts = dayPattern.split(text);
        
        // 第一个部分可能是开头内容，如果没有DAY开头，则作为DAY1
        List<String> daySections = new ArrayList<>();
        
        Matcher matcher = dayPattern.matcher(text);
        List<Integer> dayStartPositions = new ArrayList<>();
        
        while (matcher.find()) {
            dayStartPositions.add(matcher.start());
        }
        
        if (dayStartPositions.isEmpty()) {
            // 如果没有找到DAY开头，整个文本作为DAY1
            daySections.add(text.trim());
        } else {
            // 分割文本
            int lastEnd = 0;
            for (int start : dayStartPositions) {
                if (start > lastEnd) {
                    daySections.add(text.substring(lastEnd, start).trim());
                    lastEnd = start;
                }
                
                // 找到下一个DAY开始位置
                int nextStart = dayStartPositions.size() > dayStartPositions.indexOf(start) + 1 
                    ? dayStartPositions.get(dayStartPositions.indexOf(start) + 1) 
                    : text.length();
                
                daySections.add(text.substring(start, nextStart).trim());
                lastEnd = nextStart;
            }
            
            // 处理剩余部分
            if (lastEnd < text.length()) {
                daySections.add(text.substring(lastEnd).trim());
            }
        }
        
        return daySections.toArray(new String[0]);
    }
    
    /**
     * 从单天文本中提取时间地点对
     */
    private List<TimePlacePair> extractTimePlacePairs(String dayText) {
        List<TimePlacePair> pairs = new ArrayList<>();
        
        if (dayText == null || dayText.trim().isEmpty()) {
            return pairs;
        }
        
        // 匹配时间模式（HH:MM或HH时MM分）
        Pattern timePattern = Pattern.compile("(\\d{1,2}:\\d{2})|(\\d{1,2}\\s*时\\s*\\d{1,2}\\s*分)");
        
        // 分割文本为句子或段落
        String[] sentences = dayText.split("[。！？\\n]");
        
        for (String sentence : sentences) {
            if (sentence.trim().isEmpty()) continue;
            
            
            Matcher timeMatcher = timePattern.matcher(sentence);
            
            while (timeMatcher.find()) {
                String time = timeMatcher.group();
                
                // 标准化时间格式
                time = normalizeTime(time);
                
                // 提取地点（时间前后的内容）
                String place = extractPlaceFromSentence(sentence, timeMatcher.start());
                
                if (!place.trim().isEmpty()) {
                    pairs.add(new TimePlacePair(time, place.trim()));
                }
            }
            
            // 如果没有找到明确的时间，但句子中包含地点信息，尝试推断
            if (!timeMatcher.find() && containsPlaceKeywords(sentence)) {
                String inferredTime = inferTimeFromContext(sentence, pairs);
                String place = extractPlaceName(sentence);
                
                if (!place.trim().isEmpty() && inferredTime != null) {
                    pairs.add(new TimePlacePair(inferredTime, place.trim()));
                }
            }
        }
        
        // 按时间排序
        pairs.sort((p1, p2) -> {
            String[] time1 = p1.getTime().split(":");
            String[] time2 = p2.getTime().split(":");
            
            int hour1 = Integer.parseInt(time1[0]);
            int hour2 = Integer.parseInt(time2[0]);
            
            if (hour1 != hour2) {
                return Integer.compare(hour1, hour2);
            }
            
            int minute1 = time1.length > 1 ? Integer.parseInt(time1[1]) : 0;
            int minute2 = time2.length > 1 ? Integer.parseInt(time2[1]) : 0;
            
            return Integer.compare(minute1, minute2);
        });
        
        return pairs;
    }
    
    /**
     * 标准化时间格式
     */
    private String normalizeTime(String time) {
        // 处理"时"和"分"的格式
        if (time.contains("时")) {
            time = time.replaceAll("\\s*时\\s*", ":")
                     .replaceAll("\\s*分\\s*", "");
        }
        
        // 确保时间格式为HH:MM
        String[] parts = time.split(":");
        if (parts.length == 2) {
            String hour = parts[0].length() == 1 ? "0" + parts[0] : parts[0];
            String minute = parts[1].length() == 1 ? "0" + parts[1] : parts[1];
            return hour + ":" + minute;
        }
        
        return time;
    }
    
    /**
     * 从句子中提取地点
     */
    private String extractPlaceFromSentence(String sentence, int timePosition) {
        // 提取时间前后的一些关键词作为地点
        String place = sentence.replaceAll("(?i)(DAY\\s*\\d+|第\\s*\\d+\\s*天|早上|上午|中午|下午|晚上|出发|到达|参观|游览|游玩)", "")
                             .replaceAll("\\d{1,2}:\\d{2}|\\d{1,2}\\s*时\\s*\\d{1,2}\\s*分", "")
                             .replaceAll("[。，、；：！？（）【】『』「」]", "")
                             .trim();
        
        // 如果地点信息过长，截取合理长度
        if (place.length() > 50) {
            place = place.substring(0, 50);
        }
        
        return place;
    }
    
    /**
     * 检查句子是否包含地点关键词
     */
    private boolean containsPlaceKeywords(String sentence) {
        // 常见的地点相关关键词
        String[] placeKeywords = {"景点", "景区", "公园", "广场", "博物馆", "纪念馆", "寺庙", "教堂", 
                                "商场", "市场", "餐厅", "饭店", "酒店", "宾馆", "机场", "车站", 
                                "码头", "海滩", "山", "湖", "河", "街道", "路", "巷", "胡同"};
        
        for (String keyword : placeKeywords) {
            if (sentence.contains(keyword)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 从上下文中推断时间
     */
    private String inferTimeFromContext(String sentence, List<TimePlacePair> existingPairs) {
        // 根据上下文关键词推断时间
        if (sentence.contains("早上") || sentence.contains("早晨")) {
            return "08:00";
        } else if (sentence.contains("上午")) {
            return "10:00";
        } else if (sentence.contains("中午")) {
            return "12:00";
        } else if (sentence.contains("下午")) {
            return "14:00";
        } else if (sentence.contains("晚上")) {
            return "18:00";
        }
        
        // 如果没有找到关键词，使用默认时间或基于现有时间推断
        if (!existingPairs.isEmpty()) {
            TimePlacePair lastPair = existingPairs.get(existingPairs.size() - 1);
            String lastTime = lastPair.getTime();
            
            // 在上一个时间基础上加1小时
            String[] timeParts = lastTime.split(":");
            int hour = Integer.parseInt(timeParts[0]) + 1;
            if (hour >= 24) hour = 0;
            
            return String.format("%02d:00", hour);
        }
        
        return "09:00"; // 默认时间
    }
    
    /**
     * 提取地点名称
     */
    private String extractPlaceName(String sentence) {
        // 简单的地点名称提取逻辑
        String place = sentence.replaceAll("(?i)(DAY\\s*\\d+|第\\s*\\d+\\s*天|早上|上午|中午|下午|晚上|出发|到达|参观|游览|游玩)", "")
                             .replaceAll("\\d{1,2}:\\d{2}|\\d{1,2}\\s*时\\s*\\d{1,2}\\s*分", "")
                             .replaceAll("[。，、；：！？（）【】『』「」]", "")
                             .trim();
        
        // 如果地点信息过长，截取合理长度
        if (place.length() > 50) {
            place = place.substring(0, 50);
        }
        
        return place;
    }
    
    /**
     * 根据##标记分割文本
     */
    private String[] splitTextByDayMarkers(String text) {
        // 匹配##第1天##，##第2天##等标记
        Pattern dayPattern = Pattern.compile("##第\\d+天##");
        
        List<String> daySections = new ArrayList<>();
        
        Matcher matcher = dayPattern.matcher(text);
        List<Integer> dayStartPositions = new ArrayList<>();
        
        // 找到所有天数标记的起始位置
        while (matcher.find()) {
            dayStartPositions.add(matcher.start());
            // 输出提取到的天数
            log.info("提取到天数标记: {}，位置: {}", matcher.group(), matcher.start());
        }
        
        // 输出总共提取到的天数数量
        log.info("总共提取到 {} 个天数标记", dayStartPositions.size());
        
        if (dayStartPositions.isEmpty()) {
            // 如果没有找到天数标记，整个文本作为DAY1
            daySections.add(text.trim());
        } else {
            // 处理每个天数的内容
            for (int i = 0; i < dayStartPositions.size(); i++) {
                int start = dayStartPositions.get(i);
                int end = (i + 1 < dayStartPositions.size()) 
                    ? dayStartPositions.get(i + 1) 
                    : text.length();
                
                // 提取每个天数的完整内容（包含##标记和之后的内容）
                String dayContent = text.substring(start, end).trim();
                
                // 只添加非空内容
                if (!dayContent.isEmpty()) {
                    daySections.add(dayContent);
                }
            }
        }
        
        return daySections.toArray(new String[0]);
    }
    
    /**
     * 从标记化的文本中提取时间地点对
     */
    private List<TimePlacePair> extractTimePlacePairsFromMarkers(String dayText) {
        List<TimePlacePair> pairs = new ArrayList<>();
        
        if (dayText == null || dayText.trim().isEmpty()) {
            return pairs;
        }
        
        // 提取$$中的时间
        Pattern timePattern = Pattern.compile("\\$([^$]+)\\$");
        Matcher timeMatcher = timePattern.matcher(dayText);
        
        // 提取【】中的地点
        Pattern placePattern = Pattern.compile("【([^】]+)】");
        Matcher placeMatcher = placePattern.matcher(dayText);
        
        List<String> times = new ArrayList<>();
        List<String> places = new ArrayList<>();
        
        // 收集所有时间
        while (timeMatcher.find()) {
            String time = timeMatcher.group(1).trim();
            times.add(time);
        }
        
        // 收集所有地点
        while (placeMatcher.find()) {
            String place = placeMatcher.group(1).trim();
            places.add(place);
        }
        
        // 创建时间地点对（按出现顺序匹配）
        int maxPairs = Math.min(times.size(), places.size());
        for (int i = 0; i < maxPairs; i++) {
            String time = times.get(i);
            String place = places.get(i);
            
            // 标准化时间格式
            time = normalizeTime(time);
            
            pairs.add(new TimePlacePair(time, place));
        }
        
        // 如果有剩余时间或地点，单独处理
        if (times.size() > places.size()) {
            for (int i = places.size(); i < times.size(); i++) {
                String time = normalizeTime(times.get(i));
                pairs.add(new TimePlacePair(time, ""));
            }
        } else if (places.size() > times.size()) {
            for (int i = times.size(); i < places.size(); i++) {
                // 尝试推断时间
                String inferredTime = inferTimeFromContext("", pairs);
                pairs.add(new TimePlacePair(inferredTime, places.get(i)));
            }
        }
        
        // 按时间排序
        pairs.sort((p1, p2) -> {
            try {
                String[] time1 = p1.getTime().split(":");
                String[] time2 = p2.getTime().split(":");
                
                int hour1 = Integer.parseInt(time1[0]);
                int hour2 = Integer.parseInt(time2[0]);
                
                if (hour1 != hour2) {
                    return Integer.compare(hour1, hour2);
                }
                
                int minute1 = time1.length > 1 ? Integer.parseInt(time1[1]) : 0;
                int minute2 = time2.length > 1 ? Integer.parseInt(time2[1]) : 0;
                
                return Integer.compare(minute1, minute2);
            } catch (Exception e) {
                return 0;
            }
        });
        
        return pairs;
    }
}
