package com.ai_travel_planner.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MapController {

    @GetMapping("/")
    public String index() {
        return "forward:/static/MAP/index.html";
    }
    
    @GetMapping("/map")
    public String map() {
        return "forward:/static/MAP/index.html";
    }
}