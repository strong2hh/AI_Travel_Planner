package com.ai_travel_planner.controller;

import com.ai_travel_planner.result.Result;
import com.ai_travel_planner.DTO.LLMRequestDTO;
import com.ai_travel_planner.service.LLMService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
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
@RequestMapping("/ai")
@CrossOrigin(origins = "*")
@Slf4j
public class LLMController {
    
    @Autowired
    private LLMService llmService;


    /**
     * 接收前端 /api/ai/generate 请求，调用大模型服务
     */
    @PostMapping("/generate")
    public Result<String> generateResponse(@RequestBody LLMRequestDTO request) {
        log.info("AI服务请求 - URI: /api/ai/generate | 用户查询: {}", request.query());

        return llmService.generateResponse(request.query());
    }

}
