package com.ai_travel_planner.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/map")
public class MapController {

    @Value("${amap.api-key:#{null}}")
    private String apiKey;
    
    @Value("${amap.center:116.397428,39.90923}")
    private String center;
    
    @Value("${amap.zoom:12}")
    private String zoom;
    
    @Value("${amap.style:normal}")
    private String style;
    
    @Value("${amap.enable-geolocation:true}")
    private String enableGeolocation;
    
    @GetMapping("/")
    public String index() {
        return "forward:/static/MAP/index.html";
    }
    
    @GetMapping("/map")
    public String map() {
        return "forward:/static/MAP/index.html";
    }
    
    /**
     * 获取地图配置信息
     */
    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getMapConfig() {
        Map<String, Object> config = new HashMap<>();
        
        // 检查API密钥是否配置
        if (apiKey == null || apiKey.trim().isEmpty()) {
            config.put("apiKey", "YOUR_API_KEY");
            config.put("warning", "请配置amap.api-key参数");
        } else {
            config.put("apiKey", apiKey);
        }
        
        config.put("center", center);
        config.put("zoom", zoom);
        config.put("style", style);
        config.put("enableGeolocation", Boolean.parseBoolean(enableGeolocation));
        
        return ResponseEntity.ok(config);
    }
    
    /**
     * 检查地图服务是否可用
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getMapStatus() {
        Map<String, Object> status = new HashMap<>();
        
        boolean apiKeyConfigured = apiKey != null && !apiKey.trim().isEmpty() && !apiKey.equals("YOUR_API_KEY");
        boolean serviceAvailable = apiKeyConfigured;
        
        status.put("serviceAvailable", serviceAvailable);
        status.put("apiKeyConfigured", apiKeyConfigured);
        status.put("message", apiKeyConfigured ? "地图服务配置正常" : "请配置地图API密钥");
        
        return ResponseEntity.ok(status);
    }
}