package com.ai_travel_planner.controller;

import com.ai_travel_planner.service.AaLIBigModelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.LinkedHashMap;

/**
 * 阿里云大模型控制器
 * 处理前端请求，调用阿里云大模型服务
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AaLiBigModelController {
    
    @Autowired
    private AaLIBigModelService bigModelService;
    
    @Autowired
    private ContentSplit contentSplit;
    
    /**
     * 调用大模型生成回复并直接返回ContentSplit后的日程数据
     * @param request 包含用户输入的请求体
     * @return 包含ContentSplit处理后日程数据的响应
     */
    @PostMapping("/ai/generate")
    public ResponseEntity<Map<String, Object>> generateResponse(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 获取用户输入
            String query = request.get("query");
            if (query == null || query.trim().isEmpty()) {
                response.put("success", false);
                response.put("error", "请输入有效的问题");
                return ResponseEntity.badRequest().body(response);
            }
            
            // 添加对大模型的格式要求
            String formattedQuery = query + "\n请按照以下格式要求生成旅游规划：\n" +
                    "1. 每天给出详细的时间和地点\n" +
                    "2. 时间用$$框选起来，例如：$09:00-10:00$\n" +
                    "3. 地点用【】框选起来，例如：【天安门广场】\n" +
                    "4. 除时间和地点外，其他文本不要使用$和【】字符\n" +
                    "5. 每天的旅游内容用##第1天##，##第2天##等分割\n" +
                    "6. 第1天、第2天等独立占一行，用##框选起来\n" +
                    "7. 除天数字符外，其他文本不要使用#字符\n" +
                    "8. 在地点与】之间加入（城市），城市为中文，例如：【天安门广场（北京）】" ;
            
            // 调用大模型服务
            String aiResponse = bigModelService.generateResponse(formattedQuery);
            
            // 立即对AI返回的文本进行ContentSplit处理
            Map<String, List<ContentSplit.TimePlacePair>> splitResult = contentSplit.timeAndPlaceExtraction(aiResponse);
            
            // 转换为前端可以直接显示的格式
            Map<String, Object> scheduleData = convertContentSplitToFrontendFormat(splitResult);
            
            // 返回结构化的日程数据
            response.put("success", true);
            response.put("query", query);
            response.put("originalResponse", aiResponse); // 保留原始回复（可选）
            response.put("scheduleData", scheduleData); // 结构化日程数据
            response.put("dayCount", splitResult.size());
            response.put("totalItems", countTotalItems(splitResult));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "AI服务异常: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 将ContentSplit分割结果转换为前端需要的格式
     */
    private Map<String, Object> convertContentSplitToFrontendFormat(Map<String, List<ContentSplit.TimePlacePair>> splitResult) {
        Map<String, Object> formattedData = new LinkedHashMap<>();
        
        for (Map.Entry<String, List<ContentSplit.TimePlacePair>> entry : splitResult.entrySet()) {
            String dayKey = entry.getKey();
            List<ContentSplit.TimePlacePair> timePlacePairs = entry.getValue();
            
            // 将DAY1转换为day1格式
            String formattedDay = dayKey.toLowerCase();
            
            List<Map<String, String>> daySchedule = new ArrayList<>();
            
            // 直接使用ContentSplit的时间地点对
            for (ContentSplit.TimePlacePair pair : timePlacePairs) {
                Map<String, String> scheduleItem = new HashMap<>();
                scheduleItem.put("place", pair.getPlace());
                scheduleItem.put("time", pair.getTime());
                // 直接显示原始时间地点信息
                scheduleItem.put("description", pair.getTime() + " - " + pair.getPlace());
                
                daySchedule.add(scheduleItem);
            }
            
            formattedData.put(formattedDay, daySchedule);
        }
        
        return formattedData;
    }
    
    /**
     * 计算总项目数
     */
    private int countTotalItems(Map<String, List<ContentSplit.TimePlacePair>> splitResult) {
        int total = 0;
        for (List<ContentSplit.TimePlacePair> pairs : splitResult.values()) {
            total += pairs.size();
        }
        return total;
    }
    
    /**
     * 检查大模型服务状态
     * @return 服务状态信息
     */
    @GetMapping("/ai/status")
    public ResponseEntity<Map<String, Object>> checkServiceStatus() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 检查环境变量是否配置
            String apiKey = System.getenv("DASHSCOPE_API_KEY");
            boolean hasApiKey = apiKey != null && !apiKey.trim().isEmpty();
            
            response.put("serviceAvailable", hasApiKey);
            response.put("apiKeyConfigured", hasApiKey);
            response.put("message", hasApiKey ? "大模型服务已配置" : "请配置DASHSCOPE_API_KEY环境变量");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("serviceAvailable", false);
            response.put("error", "状态检查失败: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
}
