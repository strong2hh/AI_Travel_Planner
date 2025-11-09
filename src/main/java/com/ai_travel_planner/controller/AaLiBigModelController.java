package com.ai_travel_planner.controller;

import com.ai_travel_planner.service.AaLIBigModelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

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
    
    /**
     * 调用大模型生成回复
     * @param request 包含用户输入的请求体
     * @return 包含AI回复的响应
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
            
            // 调用大模型服务
            String aiResponse = bigModelService.generateResponse(query);
            
            // 返回结果
            response.put("success", true);
            response.put("query", query);
            response.put("response", aiResponse);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "AI服务异常: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
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
