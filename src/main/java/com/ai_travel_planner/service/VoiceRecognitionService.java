package com.ai_travel_planner.service;

import java.io.InputStream;

public interface VoiceRecognitionService {
    
    /**
     * 实时语音转写方法
     * @param audioStream 音频输入流
     * @return 转写后的文本
     */
    String realTimeVoiceTranscription(InputStream audioStream);
}
