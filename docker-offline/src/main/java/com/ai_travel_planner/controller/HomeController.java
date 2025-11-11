package com.ai_travel_planner.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * 主页控制器 - 处理根路径和默认页面映射
 */
@Controller
public class HomeController {

    /**
     * 根路径映射到地图页面
     */
    @GetMapping("/")
    public String home() {
        return "forward:/static/MAP/index.html";
    }
    
    /**
     * 首页映射
     */
    @GetMapping("/index")
    public String index() {
        return "forward:/static/MAP/index.html";
    }
    
    /**
     * 地图页面映射
     */
    @GetMapping("/map")
    public String map() {
        return "forward:/static/MAP/index.html";
    }
}