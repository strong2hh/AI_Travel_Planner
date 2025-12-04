package com.ai_travel_planner.utils;

import com.ai_travel_planner.DTO.DayDTO;
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
 * JSON 解析工具类，直接将大模型返回的 JSON 字符串映射为 DTO 对象。
 */
@Component
@Slf4j
public class JSONParserUtil {

    @Autowired
    private Gson gson;

    // 重点修改：定义我们期望的目标类型为单个 ScheduleDTO 对象
    private static final Type SCHEDULE_OBJECT_TYPE = new TypeToken<ScheduleDTO>() {}.getType();

    /**
     * 将大模型返回的行程 JSON 字符串直接解析为 ScheduleDTO 对象。
     * @param response 大模型返回的 JSON 字符串（顶层为对象）
     * @return ScheduleDTO 对象，如果解析失败则返回 null。
     */
    public ScheduleDTO parseJson(String response) { // <--- 返回类型现在是 ScheduleDTO
        String cleanResponse = response.trim();

        log.info("--- 开始使用 Gson 解析大模型返回的行程 JSON ---");

        try {
            // 使用 Gson 的 fromJson 方法直接将 JSON 字符串映射为 ScheduleDTO 对象
            ScheduleDTO itinerary = this.gson.fromJson(cleanResponse, SCHEDULE_OBJECT_TYPE);

            if (itinerary == null) {
                log.info("未能解析出有效的行程数据。");
                return null;
            }

            log.info("--- 成功提取行程信息 ---");

            // 打印提取的日程信息
            System.out.println(itinerary.toString());

            // 打印详细的每一天活动
            if (itinerary.getDays() != null) {
                for(DayDTO dayItem : itinerary.getDays()){
                    System.out.println("Day " + dayItem.getDay() + " activities extracted.");
                }
            }

            return itinerary;

        } catch (JsonSyntaxException e) {
            log.error("JSON 解析失败，请检查 JSON 格式是否正确或 DTO 字段是否匹配。错误信息: {}", e.getMessage(), e);
            return null;
        } catch (Exception e) {
            log.error("解析过程中发生未知错误: {}", e.getMessage(), e);
            return null;
        }
    }
}