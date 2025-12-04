package com.ai_travel_planner.controller;

import com.ai_travel_planner.service.VoiceRecognitionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/")
@CrossOrigin(origins = "*")
public class VoiceRecognitionController {

    @Autowired
    private VoiceRecognitionService voiceService;

    @PostMapping("/voice-recognition")
    public ResponseEntity<Map<String, Object>> recognizeVoice(@RequestParam("audio") MultipartFile audioFile) {
        Map<String, Object> response = new HashMap<>();

        try {
            if (audioFile.isEmpty()) {
                throw new IllegalArgumentException("音频文件为空");
            }

            // 限制文件大小 (10MB)
            if (audioFile.getSize() > 10 * 1024 * 1024) {
                throw new IllegalArgumentException("音频文件过大，最大支持10MB");
            }

            try (InputStream audioStream = new ByteArrayInputStream(audioFile.getBytes())) {
                String result = voiceService.realTimeVoiceTranscription(audioStream);
                response.put("success", true);
                response.put("text", result);
                return ResponseEntity.ok(response);
            }

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}