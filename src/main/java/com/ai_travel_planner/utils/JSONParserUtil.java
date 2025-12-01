package com.ai_travel_planner.utils;

import com.ai_travel_planner.DTO.ScheduleDTO;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.google.gson.JsonSyntaxException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.lang.reflect.Type;
import java.util.List;
import java.util.Collections;

/**
 * JSON 解析工具类，直接将大模型返回的 JSON 字符串映射为 DTO 列表。
 */
@Component
@Slf4j
public class JSONParserUtil {

    @Autowired
    private Gson gson;

    // 定义我们期望的目标类型：List<scheduleDTO>
    private static final Type SCHEDULE_LIST_TYPE = new TypeToken<List<ScheduleDTO>>() {}.getType();

    /**
     * 将大模型返回的行程 JSON 字符串直接解析为 scheduleDTO 列表。
     * * @param response 大模型返回的 JSON 字符串（通常是一个包含行程对象的数组）
     * @return scheduleDTO 对象的列表，如果解析失败则返回空列表。
     */
    public List<ScheduleDTO> parseJson(String response) {
        // 确保输入的 JSON 字符串是有效的（如去除首尾的额外字符或格式化）
        String cleanResponse = response.trim();

        // 记录开始解析
        log.info("--- 开始使用 Gson 解析大模型返回的行程 JSON ---");

        try {
            // 使用 Gson 的 fromJson 方法直接将 JSON 字符串映射为 List<scheduleDTO>
            List<ScheduleDTO> itinerary = this.gson.fromJson(cleanResponse, SCHEDULE_LIST_TYPE);

            if (itinerary == null || itinerary.isEmpty()) {
                log.info("未能解析出有效的行程数据或列表为空。");
                return Collections.emptyList();
            }

            log.info("--- 成功提取行程信息 ---");
            //打印一下看看日程是否成功提取
            for(ScheduleDTO itineraryItem : itinerary){
                System.out.println(itineraryItem.toString());
            }
            return itinerary;

        } catch (JsonSyntaxException e) {
            // 捕获 JSON 格式错误，如字段不匹配、结构错误等
            log.error("JSON 解析失败，请检查 JSON 格式是否正确或 DTO 字段是否匹配。错误信息: {}", e.getMessage(), e);
            // 可以在此处记录原始的 cleanResponse 方便调试
            return Collections.emptyList();
        } catch (Exception e) {
            // 捕获其他异常
            log.error("解析过程中发生未知错误: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }
}