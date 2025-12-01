package com.ai_travel_planner.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {
    // 这个方法将处理 http://localhost:8080/ 的请求
    @GetMapping("/")
    public String welcome() {
        return "Welcome to my application!";
    }
}
