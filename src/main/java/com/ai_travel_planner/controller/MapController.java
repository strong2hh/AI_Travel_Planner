package com.ai_travel_planner.controller;

import com.ai_travel_planner.properities.AmapProperities;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/map")
@CrossOrigin(origins = "*")
@Slf4j
public class MapController {

    @Autowired
    private AmapProperities amapProperities;
    /**
     * 获取地图配置信息
     */
    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getMapConfig() {
        log.info("获取地图配置密钥");
        Map<String, Object> config = new HashMap<>();
        
        // 检查API密钥是否配置
        if (amapProperities.getApiKey() == null || amapProperities.getApiKey().trim().isEmpty()) {
            config.put("warning", "请配置amap.api-key参数");
        } else {
            config.put("apiKey", amapProperities.getApiKey());
        }
        // 添加安全密钥
        config.put("securityJsCode", amapProperities.getApiSecret());
        
        return ResponseEntity.ok(config);
    }
    
    /**
     * 检查地图服务是否可用
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getMapStatus() {
        Map<String, Object> status = new HashMap<>();
        
        boolean apiKeyConfigured = amapProperities.getApiKey() != null &&
                !amapProperities.getApiKey().trim().isEmpty() &&
                !amapProperities.getApiKey().equals("YOUR_API_KEY");
        boolean serviceAvailable = apiKeyConfigured;
        
        status.put("serviceAvailable", serviceAvailable);
        status.put("apiKeyConfigured", apiKeyConfigured);
        status.put("message", apiKeyConfigured ? "地图服务配置正常" : "请配置地图API密钥");
        
        return ResponseEntity.ok(status);
    }
    
}