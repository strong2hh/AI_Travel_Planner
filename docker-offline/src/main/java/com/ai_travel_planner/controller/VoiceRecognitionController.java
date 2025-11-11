package com.ai_travel_planner.controller;

import com.ai_travel_planner.service.VoiceRecognitionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * 语音识别控制器
 * 处理前端语音识别请求，调用科大讯飞语音识别服务
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class VoiceRecognitionController {
    
    @Autowired
    private VoiceRecognitionService voiceService;
    
    /**
     * 语音识别API接口
     * 接收音频文件并返回识别结果
     */
    @PostMapping("/voice-recognition")
    public ResponseEntity<Map<String, Object>> recognizeVoice(
            @RequestParam("audio") MultipartFile audioFile) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 检查文件是否为空
            if (audioFile.isEmpty()) {
                response.put("success", false);
                response.put("error", "音频文件为空");
                return ResponseEntity.badRequest().body(response);
            }
            
            // 检查文件格式
            String contentType = audioFile.getContentType();
            if (contentType == null || !(contentType.equals("audio/webm") || 
                                        contentType.equals("audio/mpeg") ||
                                        contentType.equals("audio/wav") ||
                                        contentType.equals("audio/ogg") ||
                                        contentType.equals("audio/mp4") ||
                                        contentType.equals("audio/x-m4a"))) {
                response.put("success", false);
                response.put("error", "不支持的音频格式，支持格式：webm, mp3, wav, ogg, m4a");
                return ResponseEntity.badRequest().body(response);
            }
            
            // 检查文件大小（限制为10MB）
            if (audioFile.getSize() > 10 * 1024 * 1024) {
                response.put("success", false);
                response.put("error", "音频文件过大，最大支持10MB");
                return ResponseEntity.badRequest().body(response);
            }
            
            // 将音频数据转换为输入流
            ByteArrayInputStream audioStream = new ByteArrayInputStream(audioFile.getBytes());
            
            // 调用语音识别服务
            String recognitionResult = voiceService.realTimeVoiceTranscription(audioStream);
            
            // 关闭输入流
            audioStream.close();
            
            // 返回识别结果
            response.put("success", true);
            response.put("text", recognitionResult);
            response.put("audioSize", audioFile.getSize());
            response.put("audioType", contentType);
            
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            response.put("success", false);
            response.put("error", "音频文件处理失败：" + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "语音识别服务异常：" + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 测试M4A文件语音识别
     * 用于测试本地M4A文件是否能正确转换为PCM并调用科大讯飞API
     */
    @GetMapping("/voice-recognition/test-m4a")
    public ResponseEntity<Map<String, Object>> testM4aFile(
            @RequestParam(value = "filePath", required = false) String filePath) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 如果没有提供文件路径，使用默认路径
            if (filePath == null || filePath.trim().isEmpty()) {
                filePath = "C:\\Users\\Admin\\Downloads\\新录音 2.m4a";
            }
            
            // 调用语音服务测试M4A文件
            String testResult = ((com.ai_travel_planner.service.Impl.VoiceServiceImpl) voiceService).testM4aFile(filePath);
            
            response.put("success", true);
            response.put("filePath", filePath);
            response.put("testResult", testResult);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "M4A文件测试失败：" + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 测试音频格式检测功能
     */
    @GetMapping("")
    public ResponseEntity<Map<String, Object>> testAudioFormatDetection(
            @RequestParam(value = "filePath", required = false) String filePath) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 如果没有提供文件路径，使用默认路径
            if (filePath == null || filePath.trim().isEmpty()) {
                filePath = "C:\\Users\\Admin\\Downloads\\新录音 2.m4a";
            }
            
            // 调用语音服务测试音频格式检测
            String testResult = ((com.ai_travel_planner.service.Impl.VoiceServiceImpl) voiceService).testAudioFormatDetection(filePath);
            
            response.put("success", true);
            response.put("filePath", filePath);
            response.put("testResult", testResult);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "音频格式检测测试失败：" + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * 语音识别服务状态检查
     */
    @GetMapping("/voice-recognition/status")
    public ResponseEntity<Map<String, Object>> checkVoiceRecognitionStatus() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 检查YAML配置文件是否存在和配置是否正确
            Map<String, Object> config = loadVoiceConfigFromYaml();
            String apiKey = getConfigValue(config, "iflytek.voice.api-key");
            String apiSecret = getConfigValue(config, "iflytek.voice.api-secret");
            String appId = getConfigValue(config, "iflytek.voice.app-id");
            
            boolean apiKeyConfigured = apiKey != null && !apiKey.trim().isEmpty();
            boolean apiSecretConfigured = apiSecret != null && !apiSecret.trim().isEmpty();
            boolean appIdConfigured = appId != null && !appId.trim().isEmpty();
            
            boolean serviceAvailable = apiKeyConfigured && apiSecretConfigured && appIdConfigured;
            
            response.put("serviceAvailable", serviceAvailable);
            response.put("apiKeyConfigured", apiKeyConfigured);
            response.put("apiSecretConfigured", apiSecretConfigured);
            response.put("appIdConfigured", appIdConfigured);
            response.put("message", "语音识别服务状态检查完成");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("serviceAvailable", false);
            response.put("error", "状态检查失败：" + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * 从YAML配置文件加载语音配置
     */
    private Map<String, Object> loadVoiceConfigFromYaml() {
        try {
            String configPath = "src/main/resources/application-iflytek.yml";
            org.yaml.snakeyaml.Yaml yaml = new org.yaml.snakeyaml.Yaml();
            java.io.FileInputStream inputStream = new java.io.FileInputStream(configPath);
            return yaml.load(inputStream);
        } catch (java.io.FileNotFoundException e) {
            throw new RuntimeException("YAML配置文件未找到: " + e.getMessage(), e);
        }
    }
    
    /**
     * 从配置中获取指定键的值
     */
    private String getConfigValue(Map<String, Object> config, String keyPath) {
        try {
            String[] keys = keyPath.split("\\.");
            Map<String, Object> currentMap = config;
            
            for (int i = 0; i < keys.length - 1; i++) {
                currentMap = (Map<String, Object>) currentMap.get(keys[i]);
                if (currentMap == null) {
                    return null;
                }
            }
            
            Object value = currentMap.get(keys[keys.length - 1]);
            return value != null ? value.toString() : null;
        } catch (Exception e) {
            return null;
        }
    }
}