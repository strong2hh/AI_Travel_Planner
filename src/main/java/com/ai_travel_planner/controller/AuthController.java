package com.ai_travel_planner.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.anon-key}")
    private String supabaseAnonKey;

    @GetMapping("/config")
    public Map<String, String> getSupabaseConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("url", supabaseUrl);
        config.put("anonKey", supabaseAnonKey);
        return config;
    }
}