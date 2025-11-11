package com.ai_travel_planner.controller;

import com.ai_travel_planner.service.ScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/schedule")
@Slf4j
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ScheduleController {
    
    private final ScheduleService scheduleService;
    
    /**
     * 获取行程安排数据
     * 对应前端map.js中的请求：const response = await fetch('/api/schedule/data');
     * 
     * @return 包含行程安排数据的响应
     */
    @GetMapping("/data")
    public ResponseEntity<Map<String, Object>> getScheduleData() {
        try {
            log.info("接收到行程数据请求");
            
            // 模拟行程文本数据（实际应用中可以从数据库或其他服务获取）
            String scheduleText = generateSampleScheduleText();
            
            // 调用ScheduleService解析行程数据
            Map<String, Object> result = scheduleService.getSchedule(scheduleText);
            
            log.info("行程数据请求处理完成，结果: {}", result.get("success"));
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("行程数据请求处理失败: {}", e.getMessage(), e);
            
            Map<String, Object> errorResult = Map.of(
                "success", false,
                "data", Map.of(),
                "error", "服务器内部错误: " + e.getMessage()
            );
            
            return ResponseEntity.internalServerError().body(errorResult);
        }
    }
    
    /**
     * 生成示例行程文本数据
     * 实际应用中应该从数据库或其他服务获取真实数据
     */
    private String generateSampleScheduleText() {
        return "DAY1:\n" +
               "  - 07:00-08:00 → 杭州东站\n" +
               "  - 08:30-10:30 → 湖滨银泰in77\n" +
               "  - 11:00-12:00 → 西湖风景区\n" +
               "  - 12:30-13:30 → 断桥残雪\n" +
               "  - 14:00-17:00 → 白堤\n" +
               "  - 17:30-19:00 → 平湖秋月\n" +
               "  - 19:30-20:30 → 孤山\n" +
               "  - 20:00 → 苏小小墓\n" +
               "  - 21:00 → 南山路\n" +
               "  - 22:00 → 音乐喷泉\n\n" +
               "DAY2:\n" +
               "  - 08:00-09:00 → 灵隐寺\n" +
               "  - 09:30-11:30 → 飞来峰景区\n" +
               "  - 12:00-13:00 → 灵隐寺附近素斋馆\n" +
               "  - 13:30-15:30 → 龙井村\n" +
               "  - 16:00-17:30 → 九溪烟树\n" +
               "  - 18:00-19:30 → 九溪十八涧\n" +
               "  - 20:00-21:00 → 武林夜市\n\n" +
               "DAY3:\n" +
               "  - 08:30-09:30 → 中国丝绸博物馆\n" +
               "  - 10:00-11:30 → 吴山广场\n" +
               "  - 12:00-13:00 → 吴山城隍阁\n" +
               "  - 13:30-15:00 → 河坊街\n" +
               "  - 15:30-17:00 → 杭州东站\n" +
               "  - 17:30-19:30 →";
    }
    
    /**
     * 接收自定义行程文本并解析
     * 
     * @param request 包含行程文本的请求体
     * @return 解析后的行程数据
     */
    @PostMapping("/parse")
    public ResponseEntity<Map<String, Object>> parseSchedule(@RequestBody Map<String, String> request) {
        try {
            String scheduleText = request.get("text");
            
            if (scheduleText == null || scheduleText.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "请求参数错误：行程文本不能为空"
                ));
            }
            
            log.info("接收到自定义行程解析请求，文本长度: {}", scheduleText.length());
            
            Map<String, Object> result = scheduleService.getSchedule(scheduleText);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("自定义行程解析失败: {}", e.getMessage(), e);
            
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", "行程解析失败: " + e.getMessage()
            ));
        }
    }
}
