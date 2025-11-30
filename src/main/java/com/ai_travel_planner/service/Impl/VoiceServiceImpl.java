package com.ai_travel_planner.service.Impl;

import com.ai_travel_planner.service.VoiceRecognitionService;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.InitializingBean;
import java.io.ByteArrayOutputStream;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.net.URI;
import java.util.Base64;
import java.util.concurrent.CompletionStage;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.Arrays;
import java.text.SimpleDateFormat;
import java.util.Locale;
import java.util.TimeZone;
import java.util.Date;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.util.Map;
import org.yaml.snakeyaml.Yaml;
import com.ai_travel_planner.utils.AudioConverter;

/**
 * 科大讯飞语音听写服务实现类（WebSocket版本）
 */
@Slf4j
@Service
public class VoiceServiceImpl implements VoiceRecognitionService, InitializingBean {
    
    // 音频转换器实例
    private final AudioConverter audioConverter = new AudioConverter();
    
    // 科大讯飞API配置
    @Value("${iflytek.voice.app-id}")
    private String appId;
    
    @Value("${iflytek.voice.api-key}")
    private String apiKey;
    
    @Value("${iflytek.voice.api-secret}")
    private String apiSecret;
    
    // 实现InitializingBean接口的afterPropertiesSet方法
    @Override
    public void afterPropertiesSet() throws Exception {
        log.info("科大讯飞语音服务初始化");
        log.info("配置验证: AppId {}, ApiKey {}, ApiSecret {}", 
                appId != null && !appId.isEmpty() ? "已配置" : "未配置",
                apiKey != null && !apiKey.isEmpty() ? "已配置" : "未配置",
                apiSecret != null && !apiSecret.isEmpty() ? "已配置" : "未配置");
    }
    
    // 用于测试的getter方法
    public String getAppId() {
        return appId;
    }
    
    public String getApiKey() {
        return apiKey;
    }
    
    public String getApiSecret() {
        return apiSecret;
    }

    // 语音听写WebSocket接口（推荐使用中英文版本）
    private static final String WS_URL = "wss://iat-api.xfyun.cn/v2/iat";

    // 音频参数
    private static final int SAMPLE_RATE = 16000;
    private static final int CHANNELS = 1;
    private static final int BIT_DEPTH = 16;

    // 音频发送参数
    private static final int CHUNK_SIZE = 1280; // 每40ms发送1280字节
    private static final int CHUNK_INTERVAL = 40; // 40ms

    // 语音听写帧状态（与官方示例一致）
    public static final int StatusFirstFrame = 0;
    public static final int StatusContinueFrame = 1;
    public static final int StatusLastFrame = 2;

    @Override
    public String realTimeVoiceTranscription(InputStream audioStream) {
        // 校验配置文件
        if (apiKey == null || apiKey.isEmpty()) {
            log.info("请配置application.properties中的api-key");
            return "";
        }
        if (apiSecret == null || apiSecret.isEmpty()) {
            log.info("请配置application.properties中的api-secret");
            return "";
        }
        if (appId == null || appId.isEmpty()) {
            log.info("请配置application.properties中的app-id");
            return "";
        }

        try {
            if (audioStream == null) {
                log.info("音频输入流为空");
                return "";
            }

            // 先读取音频数据到内存
            byte[] audioData = readAudioData(audioStream);
            
            // 使用AudioConverter转换音频格式
            byte[] processedAudio;
            try (ByteArrayInputStream freshStream = new ByteArrayInputStream(audioData)) {
                processedAudio = audioConverter.processAudioToPcm(freshStream);
            } catch (Exception e) {
                log.info("音频转换失败: " + e.getMessage());
                processedAudio = new byte[0];
                log.info("创建了长度为0的音频");
            }

            System.out.println("处理后的PCM音频长度: " + processedAudio.length + "字节");

            return callWebSocketAsrApi(apiKey, apiSecret, appId, new java.io.ByteArrayInputStream(processedAudio));

        } catch (Exception e) {
            System.err.println("实时语音转写异常: " + e.getMessage());
            return "转写失败: " + e.getMessage();
        }
    }

    /**
     * 调用WebSocket语音听写API
     */
    private String callWebSocketAsrApi(String apiKey, String apiSecret, String appId, InputStream audioStream) {
        try {
            // 1. 读取并处理音频
            byte[] audioData = readAudioData(audioStream);
            if (audioData.length == 0) {
                return "无有效音频数据（需PCM格式）";
            }

            // 检查音频长度是否超过60秒限制
            int maxAudioLength = SAMPLE_RATE * BIT_DEPTH / 8 * CHANNELS * 60; // 60秒的最大字节数
            if (audioData.length > maxAudioLength) {
                System.out.println("警告: 音频长度超过60秒限制，将截取前60秒");
                byte[] truncatedAudio = new byte[maxAudioLength];
                System.arraycopy(audioData, 0, truncatedAudio, 0, maxAudioLength);
                audioData = truncatedAudio;
            }

            System.out.println("音频数据长度: " + audioData.length + "字节");

            // 2. 生成授权参数
            String gmtTime = getGMTCurrentTime();
            String authParam = generateAuthParam(apiKey, apiSecret, appId, gmtTime);
            
            // 3. 构建WebSocket连接
            String wsUrl = String.format("wss://iat-api.xfyun.cn/v2/iat?%s", authParam);
            System.out.println("WebSocket连接地址: " + wsUrl);
            
            // 打印详细的认证参数用于调试
            System.out.println("=== 认证参数详情 ===");
            System.out.println("GMT时间: " + gmtTime);
            System.out.println("API Key前10位: " + apiKey.substring(0, Math.min(10, apiKey.length())));
            System.out.println("认证参数: " + authParam);
            System.out.println("===================");
                
            // 4. 使用CompletableFuture来异步获取结果
            final java.util.concurrent.CompletableFuture<String> resultFuture = new java.util.concurrent.CompletableFuture<>();
            final StringBuilder finalResult = new StringBuilder();
                
            // 5. 创建WebSocket连接
            WebSocket webSocket = null;
            try {
                HttpClient client = HttpClient.newHttpClient();
                webSocket = client.newWebSocketBuilder()
                    .buildAsync(URI.create(wsUrl), new WebSocket.Listener() {
                        @Override
                        public CompletionStage<?> onText(WebSocket webSocket, CharSequence data, boolean last) {
                            try {
                                String response = data.toString();
                                System.out.println("收到WebSocket响应: " + response);
                                
                                // 使用改进的语音听写响应解析方法
                                String parsedResult = parseSpeechDictationResponse(response);
                                
                                // 检查是否为有效识别结果
                                boolean isError = parsedResult.startsWith("语音听写错误") || 
                                                parsedResult.startsWith("未知响应格式") ||
                                                parsedResult.startsWith("解析响应异常");
                                
                                if (!isError) {
                                    // 即使解析结果为空，也添加到最终结果中
                                    // 这样可以累积多个响应中的结果
                                    finalResult.append(parsedResult);
                                    System.out.println("添加识别结果: '" + parsedResult + "'");
                                }
                                
                                // 检查响应状态，判断是否完成
                                boolean isComplete = response.contains("\"status\":2") || 
                                                    (response.contains("\"code\":0") && response.contains("\"status\":2"));
                                
                                if (isComplete) {
                                    String finalText = finalResult.toString().trim();
                                    System.out.println("识别完成，最终结果: '" + finalText + "'");
                                    
                                    if (finalText.isEmpty()) {
                                        // 检查原始响应中是否有其他文本内容
                                        String directExtraction = extractDirectText(response);
                                        if (!directExtraction.isEmpty()) {
                                            System.out.println("从原始响应中直接提取文本: '" + directExtraction + "'");
                                            resultFuture.complete(directExtraction);
                                        } else {
                                            System.out.println("识别完成，但无有效结果");
                                            resultFuture.complete("语音识别无结果，请检查音频内容或尝试重新录音");
                                        }
                                    } else {
                                        resultFuture.complete(finalText);
                                    }
                                }
                                
                                return WebSocket.Listener.super.onText(webSocket, data, last);
                            } catch (Exception e) {
                                System.err.println("处理WebSocket响应时出错: " + e.getMessage());
                                return WebSocket.Listener.super.onText(webSocket, data, last);
                            }
                        }
                        
                        @Override
                        public CompletionStage<?> onClose(WebSocket webSocket, int statusCode, String reason) {
                            try {
                                System.out.println("WebSocket连接关闭: " + statusCode + " - " + reason);
                                
                                // 如果连接关闭时还没有结果，返回默认值
                                if (!resultFuture.isDone()) {
                                    String finalText = finalResult.toString().trim();
                                    if (finalText.isEmpty()) {
                                        resultFuture.complete("语音识别服务连接已关闭，无识别结果");
                                    } else {
                                        resultFuture.complete(finalText);
                                    }
                                }
                                
                                return WebSocket.Listener.super.onClose(webSocket, statusCode, reason);
                            } catch (Exception e) {
                                System.err.println("处理WebSocket关闭事件时出错: " + e.getMessage());
                                return WebSocket.Listener.super.onClose(webSocket, statusCode, reason);
                            }
                        }
                        
                        @Override
                        public void onError(WebSocket webSocket, Throwable error) {
                            try {
                                System.err.println("WebSocket错误: " + error.getMessage());
                                if (!resultFuture.isDone()) {
                                    resultFuture.completeExceptionally(error);
                                }
                            } catch (Exception e) {
                                System.err.println("处理WebSocket错误时出错: " + e.getMessage());
                            }
                        }
                    }).join();
            } catch (java.util.concurrent.CompletionException e) {
                // CompletionException 可能包装了 WebSocketHandshakeException
                Throwable cause = e.getCause();
                if (cause instanceof java.net.http.WebSocketHandshakeException) {
                    java.net.http.WebSocketHandshakeException wsException = (java.net.http.WebSocketHandshakeException) cause;
                    System.err.println("WebSocket握手异常: " + wsException.getMessage());
                    System.err.println("可能的解决方案:");
                    System.err.println("1. 检查API Key和API Secret是否正确");
                    System.err.println("2. 检查网络连接是否正常");
                    System.err.println("3. 检查系统时间是否准确（用于签名验证）");
                    return "WebSocket握手失败，请检查API配置和网络连接: " + wsException.getMessage();
                } else {
                    System.err.println("WebSocket连接异常: " + e.getMessage());
                    throw new RuntimeException("WebSocket连接失败: " + e.getMessage(), e);
                }
            } catch (Exception e) {
                System.err.println("WebSocket连接异常: " + e.getMessage());
                throw new RuntimeException("WebSocket连接失败: " + e.getMessage(), e);
            }

            // 6. 分块发送音频数据
            if (webSocket != null) {
                sendAudioDataInChunks(webSocket, audioData, appId);
                
                // 7. 等待响应（设置超时时间）
                try {
                    // 根据音频时长动态设置超时时间
                    int audioDurationSeconds = (audioData.length * 8) / (SAMPLE_RATE * BIT_DEPTH * CHANNELS);
                    int timeoutSeconds = Math.max(10, Math.min(30, 10 + audioDurationSeconds));
                    
                    System.out.println("音频时长约: " + audioDurationSeconds + "秒，设置超时时间: " + timeoutSeconds + "秒");
                    
                    String result = resultFuture.get(timeoutSeconds, java.util.concurrent.TimeUnit.SECONDS);
                    
                    // 8. 关闭连接
                    webSocket.sendClose(WebSocket.NORMAL_CLOSURE, "音频发送完成");
                    
                    System.out.println("语音识别成功完成");
                    return result;
                    
                } catch (java.util.concurrent.TimeoutException e) {
                    System.err.println("语音识别超时");
                    webSocket.sendClose(WebSocket.NORMAL_CLOSURE, "超时关闭");
                    return "语音识别超时，请重新尝试（可能音频文件过大或网络问题）";
                } catch (Exception e) {
                    webSocket.sendClose(WebSocket.NORMAL_CLOSURE, "异常关闭");
                    return "语音识别异常: " + e.getMessage();
                }
            }
            
            return "WebSocket连接失败";
            
        } catch (Exception e) {
            System.err.println("语音听写API调用异常: " + e.getMessage());
            throw new RuntimeException("语音听写API调用异常: " + e.getMessage(), e);
        }
    }

    /**
     * 分块发送音频数据
     */
    private void sendAudioDataInChunks(WebSocket webSocket, byte[] audioData, String appId) {
        try {
            int offset = 0;
            int status = StatusFirstFrame;
            int chunkCount = 0;
            
            System.out.println("开始发送音频数据，总长度: " + audioData.length + "字节");
            
            while (true) {
                try {
                    switch (status) {
                        case StatusFirstFrame:   // 第一帧音频status = 0
                            // 第一帧必须包含完整的common和business参数
                            int firstChunkSize = Math.min(CHUNK_SIZE, audioData.length);
                            byte[] firstChunk = Arrays.copyOfRange(audioData, 0, firstChunkSize);
                            
                            String frame = String.format(
                                "{\"common\":{\"app_id\":\"%s\"},\"business\":{\"language\":\"zh_cn\",\"domain\":\"iat\",\"accent\":\"mandarin\"},\"data\":{\"status\":0,\"format\":\"audio/L16;rate=16000\",\"encoding\":\"raw\",\"audio\":\"%s\"}}",
                                appId, Base64.getEncoder().encodeToString(firstChunk)
                            );
                            webSocket.sendText(frame, true);
                            chunkCount++;
                            status = StatusContinueFrame; // 发送完第一帧改变status为1
                            offset = firstChunkSize;
                            System.out.println("发送第一帧，长度: " + firstChunkSize + "字节，总进度: " + offset + "/" + audioData.length);
                            break;
                            
                        case StatusContinueFrame:  // 中间帧status = 1
                            // 检查是否还有数据要发送
                            if (offset >= audioData.length) {
                                // 所有数据已发送，转换为最后一帧状态
                                status = StatusLastFrame;
                                continue;
                            }
                            
                            int end = Math.min(offset + CHUNK_SIZE, audioData.length);
                            byte[] chunk = Arrays.copyOfRange(audioData, offset, end);
                            
                            // 中间帧只需要data参数
                            String frame1 = String.format(
                                "{\"data\":{\"status\":1,\"format\":\"audio/L16;rate=16000\",\"encoding\":\"raw\",\"audio\":\"%s\"}}",
                                Base64.getEncoder().encodeToString(chunk)
                            );
                            webSocket.sendText(frame1, true);
                            chunkCount++;
                            offset = end;
                            System.out.println("发送中间帧#" + chunkCount + "，长度: " + chunk.length + "字节，总进度: " + offset + "/" + audioData.length);
                            break;
                            
                        case StatusLastFrame:    // 最后一帧音频status = 2
                            // 最后一帧表示音频发送结束
                            String frame2 = "{\"data\":{\"status\":2,\"audio\":\"\",\"format\":\"audio/L16;rate=16000\",\"encoding\":\"raw\"}}";
                            webSocket.sendText(frame2, true);
                            System.out.println("发送最后一帧，音频数据发送完成，共发送" + chunkCount + "个数据帧");
                            break;
                    }
                    
                    if (status == StatusLastFrame) {
                        break;
                    }
                    
                    // 模拟40ms间隔
                    try {
                        Thread.sleep(CHUNK_INTERVAL);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                } catch (Exception e) {
                    System.err.println("发送音频数据时出错: " + e.getMessage());
                    break;
                }
            }
        } catch (Exception e) {
            System.err.println("音频数据发送异常: " + e.getMessage());
        }
    }



    /**
     * 读取音频数据
     */
    private byte[] readAudioData(InputStream stream) throws Exception {
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        byte[] buffer = new byte[4096];
        int len;
        while ((len = stream.read(buffer)) != -1) {
            bos.write(buffer, 0, len);
        }
        return bos.toByteArray();
    }

    /**
     * 检测是否为WAV格式
     */
    private boolean isWavFormat(byte[] data) {
        return data.length >= 4 && 
                data[0] == 'R' && data[1] == 'I' && 
                data[2] == 'F' && data[3] == 'F';
    }

    /**
     * 检测是否为WebM格式
     */
    private boolean isWebmFormat(byte[] data) {
        if (data.length < 4) return false;
        
        // 标准WebM文件以"1A45DFA3"开头（EBML头部）
        boolean isStandardWebM = data[0] == (byte)0x1A && data[1] == (byte)0x45 && 
                                    data[2] == (byte)0xDF && data[3] == (byte)0xA3;
        
        // 检查文件大小合理性
        boolean isBrowserWebM = data.length > 100 && data.length < 10 * 1024 * 1024;
        
        return isStandardWebM || (isBrowserWebM && containsWebMMarkers(data));
    }

    /**
     * 检测是否为M4A格式
     */
    private boolean isM4aFormat(byte[] data) {
        if (data.length < 12) return false;
        
        // M4A文件通常以"ftypM4A"开头
        boolean isM4A = data[4] == 'f' && data[5] == 't' && data[6] == 'y' && data[7] == 'p' &&
                        (data[8] == 'M' && data[9] == '4' && data[10] == 'A');
        
        // 或者检查是否有MP4/M4A相关的标识符
        boolean hasMP4Signature = containsByteSequence(data, new byte[]{'m', 'o', 'o', 'v'}) ||
                                containsByteSequence(data, new byte[]{'m', 'd', 'a', 't'}) ||
                                containsByteSequence(data, new byte[]{'f', 't', 'y', 'p'});
        
        return isM4A || hasMP4Signature;
    }

    /**
     * 检查字节数组中是否包含指定的字节序列
     */
    private boolean containsByteSequence(byte[] data, byte[] sequence) {
        if (data.length < sequence.length) return false;
        
        for (int i = 0; i <= data.length - sequence.length; i++) {
            boolean match = true;
            for (int j = 0; j < sequence.length; j++) {
                if (data[i + j] != sequence[j]) {
                    match = false;
                    break;
                }
            }
            if (match) return true;
        }
        return false;
    }

    /**
     * 检查是否包含WebM特征
     */
    private boolean containsWebMMarkers(byte[] data) {
        if (data.length > 50) {
            // 检查是否有Matroska/WebM相关的标识符
            return (data[0] == (byte)0x1A && data[1] == (byte)0x45) || // EBML起始
                    containsByteSequence(data, new byte[]{(byte)0x1F, (byte)0x43, (byte)0xB6, (byte)0x75}) || // Cluster
                    containsByteSequence(data, new byte[]{(byte)0x18, (byte)0x53, (byte)0x80, (byte)0x67}); // Segment
        }
        return false;
    }

    /**
     * 移除WAV头部
     */
    private byte[] removeWavHeader(byte[] data) {
        if (data.length >= 44 && isWavFormat(data)) {
            System.out.println("检测到WAV文件头，自动移除");
            byte[] pcm = new byte[data.length - 44];
            System.arraycopy(data, 44, pcm, 0, pcm.length);
            return pcm;
        }
        return data;
    }

    /**
     * 将WebM格式转换为PCM格式
     */
    private byte[] convertWebmToPcm(byte[] webmData) {
        try {
            System.out.println("开始WebM到PCM转换，原始数据长度: " + webmData.length + "字节");
            
            // 检查文件头部，确认是WebM格式
            if (webmData.length < 4 || 
                !(webmData[0] == 0x1A && webmData[1] == 0x45 && 
                    webmData[2] == (byte)0xDF && webmData[3] == (byte)0xA3)) {
                System.out.println("不是标准的WebM格式，尝试原始处理");
                return convertToRawPcm(webmData);
            }
            
            // 对于简单的WebM音频，我们尝试提取音频数据
            // 这是一个简化的实现，实际应用中应该使用专门的音频处理库
            
            // 查找可能的音频数据起始位置
            int audioStart = -1;
            
            // 跳过EBML头部和Segment信息
            // WebM音频数据通常在文件的后半部分
            int searchStart = webmData.length / 2;
            
            for (int i = searchStart; i < webmData.length - 100; i++) {
                // 查找可能的音频数据区域
                // 简单的启发式方法：寻找有变化的音频数据区域
                boolean hasVariation = false;
                for (int j = 0; j < 20 && i + j < webmData.length - 1; j++) {
                    if (webmData[i + j] != webmData[i + j + 1]) {
                        hasVariation = true;
                        break;
                    }
                }
                
                if (hasVariation) {
                    // 检查这个区域是否看起来像音频数据
                    boolean looksLikeAudio = true;
                    for (int j = 0; j < 10; j++) {
                        if (i + j < webmData.length) {
                            // 音频数据通常不会有大片的0x00或0xFF
                            byte b = webmData[i + j];
                            if ((b == 0x00 || b == (byte)0xFF) && j > 2) {
                                int zeroCount = 0;
                                for (int k = Math.max(0, j-2); k <= Math.min(j+2, webmData.length-i-1); k++) {
                                    if (webmData[i+k] == 0x00 || webmData[i+k] == (byte)0xFF) {
                                        zeroCount++;
                                    }
                                }
                                if (zeroCount > 3) {
                                    looksLikeAudio = false;
                                    break;
                                }
                            }
                        }
                    }
                    
                    if (looksLikeAudio) {
                        audioStart = i;
                        break;
                    }
                }
            }
            
            if (audioStart > 0) {
                int audioLength = webmData.length - audioStart;
                
                if (audioLength > 1000) {
                    byte[] extractedAudio = new byte[audioLength];
                    System.arraycopy(webmData, audioStart, extractedAudio, 0, audioLength);
                    
                    System.out.println("从WebM容器中提取音频数据: " + extractedAudio.length + "字节");
                    return fixPcmIntegrity(extractedAudio);
                }
            }
            
            System.out.println("无法从WebM中提取音频数据，尝试原始处理");
            return convertToRawPcm(webmData);
            
        } catch (Exception e) {
            System.err.println("WebM音频转换失败: " + e.getMessage());
            return new byte[0];
        }
    }

    /**
     * 将M4A格式转换为PCM格式
     */
    private byte[] convertM4aToPcm(byte[] m4aData) {
        try {
            System.out.println("=== 开始M4A到PCM转换 ===");
            System.out.println("原始M4A数据长度: " + m4aData.length + "字节");
            
            // 检查文件头部
            if (m4aData.length < 12) {
                System.out.println("M4A文件太小，无法解析");
                return new byte[0];
            }
            
            // 显示文件头的前16个字节
            System.out.print("M4A文件头部: ");
            for (int i = 0; i < Math.min(16, m4aData.length); i++) {
                System.out.printf("%02X ", m4aData[i] & 0xFF);
            }
            System.out.println();
            
            boolean isStandardM4A = m4aData[4] == 'f' && m4aData[5] == 't' && m4aData[6] == 'y' && m4aData[7] == 'p';
            if (isStandardM4A) {
                System.out.println("检测到标准M4A格式");
            } else {
                System.out.println("非标准M4A格式，尝试通用处理");
            }
            
            // 方法1: 尝试提取mdat原子中的音频数据
            byte[] extractedAudio = extractAudioFromM4aContainer(m4aData);
            if (extractedAudio.length > 1000) {
                System.out.println("从M4A容器中提取音频数据: " + extractedAudio.length + "字节");
                
                // 对提取的音频数据进行进一步处理
                byte[] processedAudio = convertToRawPcm(extractedAudio);
                if (processedAudio.length > 1000) {
                    System.out.println("M4A转换PCM成功，最终长度: " + processedAudio.length + "字节");
                    return processedAudio;
                } else {
                    System.out.println("提取的音频数据处理后过短");
                }
            } else {
                System.out.println("从M4A容器中提取的音频数据过短或为空");
            }
            
            // 方法2: 跳过M4A头部，直接处理音频数据部分
            System.out.println("尝试方法2: 查找音频数据起始位置");
            
            // 查找可能的音频数据起始位置
            int audioDataStart = 0;
            int maxAudioStart = Math.min(2000, m4aData.length / 4); // 最多检查前25%
            
            for (int i = 0; i < maxAudioStart; i++) {
                // 查找有变化的区域，可能是音频数据的开始
                boolean hasVariation = false;
                for (int j = 0; j < 10 && i + j < m4aData.length - 1; j++) {
                    if (m4aData[i + j] != m4aData[i + j + 1]) {
                        hasVariation = true;
                        break;
                    }
                }
                
                if (hasVariation) {
                    // 检查这个区域是否看起来像音频数据
                    if (looksLikeAudioData(m4aData, i, 20)) {
                        audioDataStart = i;
                        break;
                    }
                }
            }
            
            if (audioDataStart > 0 && audioDataStart < m4aData.length - 1000) {
                int audioLength = Math.min(m4aData.length - audioDataStart, 10 * 1024 * 1024); // 最大10MB
                
                byte[] audioData = new byte[audioLength];
                System.arraycopy(m4aData, audioDataStart, audioData, 0, audioLength);
                
                System.out.println("从M4A文件中提取音频数据: " + audioLength + "字节，起始位置: " + audioDataStart);
                
                byte[] fixedPcm = fixPcmIntegrity(audioData);
                if (fixedPcm.length > 1000) {
                    System.out.println("M4A转换PCM成功（方法2），最终长度: " + fixedPcm.length + "字节");
                    return fixedPcm;
                } else {
                    System.out.println("方法2提取的音频数据修复后过短");
                }
            } else {
                System.out.println("方法2未找到有效的音频数据起始位置");
            }
            
            // 方法3: 最后尝试直接处理原始数据
            System.out.println("尝试方法3: 直接处理原始数据");
            byte[] rawPcm = convertToRawPcm(m4aData);
            
            if (rawPcm.length > 1000) {
                System.out.println("M4A转换PCM成功（方法3），最终长度: " + rawPcm.length + "字节");
                return rawPcm;
            } else {
                System.out.println("所有转换方法均失败，返回空数组");
                return new byte[0];
            }
            
        } catch (Exception e) {
            System.err.println("M4A音频转换失败: " + e.getMessage());
            e.printStackTrace();
            return new byte[0];
        }
    }

    /**
     * 检查数据区域是否看起来像音频数据
     */
    private boolean looksLikeAudioData(byte[] data, int offset, int length) {
        if (offset + length > data.length) {
            return false;
        }
        
        // 检查数据变化
        int variationCount = 0;
        int zeroCount = 0;
        
        for (int i = 0; i < length - 1; i++) {
            byte current = data[offset + i];
            byte next = data[offset + i + 1];
            
            if (current != next) {
                variationCount++;
            }
            
            if (current == 0x00 || current == (byte)0xFF) {
                zeroCount++;
            }
        }
        
        // 音频数据应该有一定的变化，且不会全部是0x00或0xFF
        double variationRatio = (double)variationCount / (length - 1);
        double zeroRatio = (double)zeroCount / length;
        
        return variationRatio > 0.1 && zeroRatio < 0.8;
    }

    /**
     * 从M4A容器中提取音频数据
     */
    private byte[] extractAudioFromM4aContainer(byte[] m4aData) {
        try {
            // 查找'mdat'原子（媒体数据原子）
            for (int i = 0; i < m4aData.length - 4; i++) {
                if (m4aData[i] == 'm' && m4aData[i+1] == 'd' && 
                    m4aData[i+2] == 'a' && m4aData[i+3] == 't') {
                    
                    if (i >= 4) {
                        int size = ((m4aData[i-4] & 0xFF) << 24) | 
                                    ((m4aData[i-3] & 0xFF) << 16) | 
                                    ((m4aData[i-2] & 0xFF) << 8) | 
                                    (m4aData[i-1] & 0xFF);
                        
                        int audioStart = i + 8;
                        
                        System.out.println("找到mdat原子，大小: " + size + ", 音频起始位置: " + audioStart);
                        
                        if (audioStart + 100 < m4aData.length) {
                            int audioLength = Math.min(m4aData.length - audioStart, 10 * 1024 * 1024);
                            byte[] extracted = new byte[audioLength];
                            System.arraycopy(m4aData, audioStart, extracted, 0, audioLength);
                            return extracted;
                        }
                    }
                }
            }
            
            // 如果找不到mdat原子，返回原始数据的一部分
            int start = Math.min(1000, m4aData.length / 10);
            int length = Math.min(m4aData.length - start, m4aData.length / 2);
            
            if (length > 1000) {
                byte[] extracted = new byte[length];
                System.arraycopy(m4aData, start, extracted, 0, length);
                return extracted;
            }
            
            return new byte[0];
            
        } catch (Exception e) {
            System.err.println("提取M4A音频数据失败: " + e.getMessage());
            return new byte[0];
        }
    }

    /**
     * 将任意音频数据转换为原始PCM格式
     */
    private byte[] convertToRawPcm(byte[] audioData) {
        try {
            if (audioData == null || audioData.length == 0) {
                System.out.println("音频数据为空");
                return new byte[0];
            }
            
            // 首先尝试移除可能的WAV头部
            byte[] pureData = removeWavHeader(audioData);
            
            // 处理PCM数据的完整性
            byte[] fixedPcm = fixPcmIntegrity(pureData);
            
            if (fixedPcm.length < 100) {
                System.out.println("音频数据过短，可能无效");
                return new byte[0];
            }
            
            System.out.println("转换为PCM格式成功，长度: " + fixedPcm.length + "字节");
            return fixedPcm;
            
        } catch (Exception e) {
            System.err.println("PCM转换失败: " + e.getMessage());
            return new byte[0];
        }
    }

    /**
     * 修复PCM数据完整性
     */
    private byte[] fixPcmIntegrity(byte[] pcm) {
        if (pcm.length % 2 != 0) {
            System.out.println("PCM字节数为奇数，修复为偶数");
            byte[] fixed = new byte[pcm.length - 1];
            System.arraycopy(pcm, 0, fixed, 0, fixed.length);
            pcm = fixed;
        }
        
        // 验证PCM数据的有效性
        if (!isValidPcmData(pcm)) {
            System.out.println("PCM数据可能无效，尝试修复");
            pcm = tryFixPcmData(pcm);
        }
        
        return pcm;
    }

    /**
     * 验证PCM数据是否有效
     */
    private boolean isValidPcmData(byte[] pcm) {
        if (pcm.length < 100) {
            System.out.println("PCM数据过短");
            return false;
        }
        
        // 检查是否有过多的静音数据
        int silenceCount = 0;
        for (int i = 0; i < Math.min(1000, pcm.length); i += 2) {
            // 16位PCM，检查两个字节是否为0（静音）
            if (pcm[i] == 0 && pcm[i+1] == 0) {
                silenceCount++;
            }
        }
        
        double silenceRatio = (double)silenceCount / (Math.min(1000, pcm.length) / 2);
        
        if (silenceRatio > 0.9) {
            System.out.println("PCM数据中静音比例过高: " + silenceRatio);
            return false;
        }
        
        return true;
    }

    /**
     * 尝试修复PCM数据
     */
    private byte[] tryFixPcmData(byte[] pcm) {
        // 如果数据中有过多的静音，尝试跳过头部寻找音频数据
        int audioStart = 0;
        
        for (int i = 0; i < pcm.length - 100; i += 2) {
            // 查找非静音区域
            if (pcm[i] != 0 || pcm[i+1] != 0) {
                // 检查这个区域是否连续有音频数据
                boolean hasContinuousAudio = true;
                int audioCount = 0;
                
                for (int j = i; j < Math.min(i + 200, pcm.length - 1); j += 2) {
                    if (pcm[j] != 0 || pcm[j+1] != 0) {
                        audioCount++;
                    } else {
                        // 如果连续静音超过一定比例，可能不是有效音频
                        if (audioCount < 10) {
                            hasContinuousAudio = false;
                            break;
                        }
                    }
                }
                
                if (hasContinuousAudio && audioCount >= 10) {
                    audioStart = i;
                    break;
                }
            }
        }
        
        if (audioStart > 0 && audioStart < pcm.length - 100) {
            int newLength = pcm.length - audioStart;
            byte[] fixedPcm = new byte[newLength];
            System.arraycopy(pcm, audioStart, fixedPcm, 0, newLength);
            
            System.out.println("跳过静音头部 " + audioStart + " 字节，保留 " + newLength + " 字节音频数据");
            return fixedPcm;
        }
        
        return pcm;
    }

    /**
     * 获取GMT格式的当前时间
     */
    private String getGMTCurrentTime() {
        SimpleDateFormat sdf = new SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss z", Locale.US);
        sdf.setTimeZone(TimeZone.getTimeZone("GMT"));
        return sdf.format(new Date());
    }

    /**
     * 生成WebSocket认证参数
     */
    private String generateAuthParam(String apiKey, String apiSecret, String appId, String gmtTime) throws Exception {
        String host = "iat-api.xfyun.cn";
        String path = "/v2/iat";
        
        // 1. 构建原始字符串用于签名
        String rawString = String.format("host: %s\ndate: %s\nGET %s HTTP/1.1", host, gmtTime, path);
        
        // 2. 使用HMAC-SHA256生成签名
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(apiSecret.getBytes("UTF-8"), "HmacSHA256");
        mac.init(secretKeySpec);
        byte[] hmacBytes = mac.doFinal(rawString.getBytes("UTF-8"));
        String signature = Base64.getEncoder().encodeToString(hmacBytes);
        
        // 3. 构建authorization字符串
        String authorization = String.format(
            "api_key=\"%s\", algorithm=\"hmac-sha256\", headers=\"host date request-line\", signature=\"%s\"",
            apiKey, signature
        );
        
        // 4. 对authorization进行Base64编码
        String encodedAuthorization = Base64.getEncoder().encodeToString(authorization.getBytes("UTF-8"));
        
        // 5. 对认证参数进行URL编码
        String encodedDate = java.net.URLEncoder.encode(gmtTime, "UTF-8");
        String encodedHost = java.net.URLEncoder.encode(host, "UTF-8");
        
        // 6. 构建完整的认证参数
        String authParam = String.format(
            "authorization=%s&date=%s&host=%s",
            encodedAuthorization, encodedDate, encodedHost
        );
        
        return authParam;
    }

    /**
     * 改进的语音听写响应解析方法
     */
    private String parseSpeechDictationResponse(String response) {
        try {
            System.out.println("开始解析WebSocket响应: " + response);
            
            // 检查响应状态
            if (response.contains("\"code\":0")) {
                System.out.println("检测到成功响应码");
                
                // 解析完整的语音听写结果
                if (response.contains("\"data\"")) {
                    int dataStart = response.indexOf("\"data\":") + 7;
                    int dataEnd = response.lastIndexOf("}") + 1; // 包含最后的}
                    if (dataStart > 7 && dataEnd > dataStart) {
                        String dataJson = response.substring(dataStart, dataEnd);
                        System.out.println("提取data字段: " + dataJson);
                        
                        // 提取result字段
                        if (dataJson.contains("\"result\"")) {
                            int resultStart = dataJson.indexOf("\"result\":") + 10;
                            // 找到result字段的结束位置
                            int resultEnd = findJsonEnd(dataJson, resultStart);
                            if (resultStart > 10 && resultEnd > resultStart) {
                                String resultJson = dataJson.substring(resultStart, resultEnd);
                                System.out.println("提取result字段: " + resultJson);
                                
                                // 检查是否有ws字段（分段识别结果）
                                if (resultJson.contains("\"ws\"")) {
                                    String text = extractFinalText(resultJson);
                                    System.out.println("从ws字段提取文本: '" + text + "'");
                                    
                                    // 即使文本为空，也不要返回错误，继续等待下一个响应
                                    return text;
                                }
                                
                                // 尝试直接提取文本内容
                                String directText = extractDirectText(resultJson);
                                System.out.println("直接提取文本: '" + directText + "'");
                                return directText;
                            }
                        }
                    }
                }
            } else if (response.contains("\"code\"")) {
                // 提取错误信息
                int codeStart = response.indexOf("\"code\":") + 7;
                int codeEnd = response.indexOf(",", codeStart);
                if (codeEnd <= codeStart) {
                    codeEnd = response.indexOf("}", codeStart);
                }
                if (codeEnd > codeStart) {
                    String code = response.substring(codeStart, codeEnd);
                    
                    int msgStart = response.indexOf("\"message\":\"") + 11;
                    int msgEnd = response.indexOf("\"", msgStart);
                    if (msgEnd > msgStart) {
                        String message = response.substring(msgStart, msgEnd);
                        return "语音听写错误: " + code + " - " + message;
                    }
                }
            }
            
            // 检查是否是中间结果
            if (response.contains("\"status\":2") || response.contains("\"status\":1")) {
                System.out.println("检测到中间结果状态，继续等待识别结果");
                return "";
            }
            
            return "";
        } catch (Exception e) {
            return "解析响应异常: " + e.getMessage() + "\n原始响应: " + response;
        }
    }

    /**
     * 查找JSON对象的结束位置
     */
    private int findJsonEnd(String json, int startPos) {
        int bracketCount = 0;
        boolean inString = false;
        boolean escaped = false;
        
        for (int i = startPos; i < json.length(); i++) {
            char c = json.charAt(i);
            
            if (escaped) {
                escaped = false;
                continue;
            }
            
            if (c == '\\') {
                escaped = true;
                continue;
            }
            
            if (c == '"') {
                inString = !inString;
                continue;
            }
            
            if (!inString) {
                if (c == '{') {
                    bracketCount++;
                } else if (c == '}') {
                    bracketCount--;
                    if (bracketCount == 0) {
                        return i + 1; // 包含结束的}
                    }
                }
            }
        }
        
        return json.length();
    }

    /**
     * 从语音听写API响应中提取最终文本
     */
    private String extractFinalText(String wsJson) {
        try {
            System.out.println("开始解析分段识别结果: " + wsJson);
            
            // 科大讯飞返回的是分段识别结果，格式类似：{"ws":[{"bg":1,"cw":[{"sc":0,"w":"检测"}]}, ...]}
            if (wsJson.contains("\"ws\"")) {
                StringBuilder result = new StringBuilder();
                
                // 首先提取整个ws数组内容
                int wsStart = wsJson.indexOf("\"ws\":[");
                if (wsStart == -1) {
                    System.err.println("未找到ws数组");
                    return "";
                }
                
                wsStart += 6; // 跳过"ws":[
                
                // 找到ws数组的结束位置（找到匹配的]）
                int bracketLevel = 0;
                int wsEnd = wsStart;
                for (int i = wsStart; i < wsJson.length(); i++) {
                    char c = wsJson.charAt(i);
                    if (c == '{') bracketLevel++;
                    else if (c == '}') bracketLevel--;
                    
                    if (bracketLevel == 0 && wsJson.charAt(i) == ']') {
                        wsEnd = i + 1;
                        break;
                    }
                }
                
                if (wsEnd <= wsStart) {
                    System.err.println("无法确定ws数组范围");
                    return "";
                }
                
                String wsArrayContent = wsJson.substring(wsStart, wsEnd);
                System.out.println("提取的ws数组内容: " + wsArrayContent);
                
                // 现在处理每个ws对象
                int pos = 0;
                while (pos < wsArrayContent.length()) {
                    // 查找下一个ws对象的开始
                    int wsObjStart = wsArrayContent.indexOf("{", pos);
                    if (wsObjStart == -1) break;
                    
                    // 找到ws对象的结束
                    int wsObjEnd = findMatchingBracket(wsArrayContent, wsObjStart);
                    if (wsObjEnd == -1) break;
                    
                    String wsObj = wsArrayContent.substring(wsObjStart, wsObjEnd + 1);
                    System.out.println("处理ws对象: " + wsObj);
                    
                    // 在这个ws对象中查找cw数组
                    int cwStart = wsObj.indexOf("\"cw\":[");
                    if (cwStart != -1) {
                        cwStart += 7; // 跳过"cw":[
                        
                        // 找到cw数组的结束
                        int cwEnd = findMatchingBracket(wsObj, cwStart);
                        if (cwEnd != -1) {
                            String cwArray = wsObj.substring(cwStart, cwEnd + 1);
                            System.out.println("提取的cw数组: " + cwArray);
                            
                            // 提取cw数组中的所有w字段
                            int cwPos = 0;
                            while (cwPos < cwArray.length()) {
                                int wStart = cwArray.indexOf("\"w\":\"", cwPos);
                                if (wStart == -1) break;
                                
                                wStart += 5; // 跳过"w":"
                                int wEnd = cwArray.indexOf("\"", wStart);
                                if (wEnd == -1) break;
                                
                                String word = cwArray.substring(wStart, wEnd);
                                result.append(word);
                                System.out.println("提取词语: '" + word + "'");
                                
                                cwPos = wEnd + 1;
                            }
                        }
                    }
                    
                    pos = wsObjEnd + 1;
                }
                
                String finalText = result.toString();
                System.out.println("最终拼接的文本: '" + finalText + "'");
                return finalText;
            }
            
            return "";
        } catch (Exception e) {
            System.err.println("提取最终文本异常: " + e.getMessage());
            e.printStackTrace();
            return "";
        }
    }
    
    /**
     * 查找匹配的括号位置
     */
    private int findMatchingBracket(String str, int start) {
        int level = 0;
        for (int i = start; i < str.length(); i++) {
            char c = str.charAt(i);
            if (c == '{') level++;
            else if (c == '}') {
                level--;
                if (level == 0) {
                    return i;
                }
            }
        }
        return -1;
    }

    /**
     * 直接从响应中提取文本内容
     */
    private String extractDirectText(String json) {
        try {
            StringBuilder result = new StringBuilder();
            
            String temp = json;
            int startPos = 0;
            
            while ((startPos = temp.indexOf("\"w\":\"", startPos)) != -1) {
                startPos += 5;
                int endPos = temp.indexOf("\"", startPos);
                if (endPos > startPos) {
                    String word = temp.substring(startPos, endPos);
                    result.append(word);
                    startPos = endPos + 1;
                }
            }
            
            return result.toString();
        } catch (Exception e) {
            return "";
        }
    }

    /**
     * 从YAML配置文件加载语音配置
     */
    private Map<String, Object> loadVoiceConfigFromYaml() {
        try {
            // 使用ClassLoader从类路径加载配置文件
            java.io.InputStream inputStream = getClass().getClassLoader().getResourceAsStream("application-iflytek.yml");
            if (inputStream == null) {
                // 如果类路径找不到，尝试使用文件系统路径
                String configPath = "src/main/resources/application-iflytek.yml";
                inputStream = new FileInputStream(configPath);
            }
            
            Yaml yaml = new Yaml();
            return yaml.load(inputStream);
        } catch (Exception e) {
            throw new RuntimeException("YAML配置文件加载失败: " + e.getMessage(), e);
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

    /**
     * 诊断音频数据
     * 检查音频数据是否符合科大讯飞API的要求
     */
    private void diagnoseAudioData(byte[] audioData) {
        log.info("=== 音频数据诊断 ===");
        log.info("数据长度: " + audioData.length + "字节");
        log.info("期望格式: PCM, 16kHz, 16位, 单声道");
        
        // 计算音频时长
        double audioDurationSeconds = (audioData.length * 8.0) / (SAMPLE_RATE * BIT_DEPTH * CHANNELS);
        log.info("估计音频时长: " + String.format("%.2f", audioDurationSeconds) + "秒");
        
        // 检查数据有效性
        if (audioData.length < 100) {
            log.info("警告: 音频数据过短");
            return;
        }
        
        // 检查前100字节的分布
        int[] byteDistribution = new int[256];
        int sampleSize = Math.min(100, audioData.length);
        
        for (int i = 0; i < sampleSize; i++) {
            byteDistribution[audioData[i] & 0xFF]++;
        }
        
        // 检查是否有过多的静音（0x00）
        int zeroCount = byteDistribution[0];
        double zeroRatio = (double)zeroCount / sampleSize;
        log.info("静音字节(0x00)比例: " + String.format("%.2f%%", zeroRatio * 100));
        
        if (zeroRatio > 0.8) {
            log.info("警告: 音频数据中静音比例过高，可能是格式转换问题");
        }
        
        // 检查数据变化
        int variationCount = 0;
        for (int i = 1; i < sampleSize; i++) {
            if (audioData[i] != audioData[i-1]) {
                variationCount++;
            }
        }
        
        double variationRatio = (double)variationCount / (sampleSize - 1);
        log.info("数据变化比例: " + String.format("%.2f%%", variationRatio * 100));
        
        if (variationRatio < 0.1) {
            log.info("警告: 音频数据变化过少，可能是静音或格式问题");
        }
        
        // 显示前16字节的十六进制值
        StringBuilder hexData = new StringBuilder("前16字节: ");
        for (int i = 0; i < Math.min(16, audioData.length); i++) {
            hexData.append(String.format("%02X ", audioData[i] & 0xFF));
        }
        log.info(hexData.toString());
        
        log.info("=== 诊断完成 ===");
    }



    /**
     * 检查音频数据是否有问题
     */
    private boolean isAudioDataProblematic(byte[] audioData) {
        if (audioData.length < 1000) {
            System.out.println("音频数据过短，可能有问题");
            return true;
        }
        
        // 检查静音比例
        int zeroCount = 0;
        int sampleSize = Math.min(1000, audioData.length / 2);
        
        for (int i = 0; i < sampleSize * 2; i += 2) {
            // 16位PCM，检查两个字节是否为0（静音）
            if ((audioData[i] == 0 && audioData[i+1] == 0) ||
                (audioData[i] == (byte)0x80 && audioData[i+1] == 0x00)) {
                zeroCount++;
            }
        }
        
        double zeroRatio = (double)zeroCount / sampleSize;
        System.out.println("静音采样比例: " + String.format("%.2f%%", zeroRatio * 100));
        
        // 如果静音比例超过80%，认为音频有问题
        if (zeroRatio > 0.8) {
            System.out.println("检测到过多静音，音频数据可能有问题");
            return true;
        }
        
        return false;
    }

    /**
     * 测试M4A文件转换和语音识别
     * 用于测试本地M4A文件是否能正确转换为PCM并调用科大讯飞API
     */
    public String testM4aFile(String filePath) {
        try {
            System.out.println("=== 开始测试M4A文件: " + filePath + " ===");
            
            // 校验配置文件
            if (apiKey == null || apiKey.isEmpty()) {
                log.info("请配置application.properties中的api-key");
                return "";
            }
            if (apiSecret == null || apiSecret.isEmpty()) {
                log.info("请配置application.properties中的api-secret");
                return "";
            }
            if (appId == null || appId.isEmpty()) {
                log.info("请配置application.properties中的app-id");
                return "";
            }
            
            // 读取M4A文件
            FileInputStream m4aStream = new FileInputStream(filePath);
            
            // 先读取原始数据用于格式检测
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            byte[] buffer = new byte[4096];
            int len;
            while ((len = m4aStream.read(buffer)) != -1) {
                bos.write(buffer, 0, len);
            }
            byte[] originalData = bos.toByteArray();
            m4aStream.close();
            
            System.out.println("=== M4A文件测试信息 ===");
            System.out.println("API Key: " + apiKey.substring(0, Math.min(10, apiKey.length())) + "...");
            System.out.println("AppID: " + appId);
            System.out.println("音频格式: PCM " + SAMPLE_RATE + "Hz/" + BIT_DEPTH + "位/" + CHANNELS + "声道");
            System.out.println("M4A文件路径: " + filePath);
            System.out.println("原始文件大小: " + originalData.length + "字节");
            
            // 显示文件头信息
            System.out.print("文件头部: ");
            for (int i = 0; i < Math.min(16, originalData.length); i++) {
                System.out.printf("%02X ", originalData[i] & 0xFF);
            }
            System.out.println();
            
            // 检测音频格式
            boolean isWav = isWavFormat(originalData);
            boolean isWebm = isWebmFormat(originalData);
            boolean isM4a = isM4aFormat(originalData);
            
            System.out.println("格式检测结果: WAV=" + isWav + ", WebM=" + isWebm + ", M4A=" + isM4a);
            
            // 重新打开文件流进行转换
            m4aStream = new FileInputStream(filePath);
            
            // 先读取音频数据到内存
            byte[] audioData = readAudioData(m4aStream);
            m4aStream.close();
            
            // 使用AudioConverter转换音频格式
            byte[] processedAudio;
            try (ByteArrayInputStream freshStream = new ByteArrayInputStream(audioData)) {
                processedAudio = audioConverter.processAudioToPcm(freshStream);
            } catch (Exception e) {
                System.err.println("M4A音频转换失败: " + e.getMessage());
                System.out.println("音频转换失败，使用空数组");
                processedAudio = new byte[0];
            }
            
            if (processedAudio.length == 0) {
                return "M4A音频格式转换失败或音频数据为空";
            }

            System.out.println("处理后的PCM音频长度: " + processedAudio.length + "字节");

            // 调用科大讯飞API
            String result = callWebSocketAsrApi(apiKey, apiSecret, appId, new java.io.ByteArrayInputStream(processedAudio));
            
            System.out.println("=== M4A文件测试结果 ===");
            System.out.println("识别结果: " + result);
            
            return result;
            
        } catch (FileNotFoundException e) {
            System.err.println("M4A文件未找到: " + filePath);
            return "M4A文件未找到: " + filePath + "\n请确保文件存在且路径正确";
        } catch (Exception e) {
            System.err.println("M4A文件测试异常: " + e.getMessage());
            e.printStackTrace();
            return "M4A文件测试失败: " + e.getMessage();
        }
    }

    /**
     * 测试音频格式检测功能
     * 用于检查M4A文件是否能被正确识别
     */
    /**
     * 分析转换后的音频数据
     */
    private void analyzeConvertedAudio(byte[] audioData) {
        System.out.println("=== 转换后音频数据分析 ===");
        System.out.println("数据长度: " + audioData.length + "字节");
        
        if (audioData.length < 100) {
            System.out.println("音频数据过短，可能无效");
            return;
        }
        
        // 计算音频时长
        double audioDurationSeconds = (audioData.length * 8.0) / (SAMPLE_RATE * BIT_DEPTH * CHANNELS);
        System.out.println("估计音频时长: " + String.format("%.2f", audioDurationSeconds) + "秒");
        
        // 检查数据变化情况
        int zeroCount = 0;
        int positiveCount = 0;
        int negativeCount = 0;
        int nonZeroCount = 0;
        
        for (int i = 0; i < audioData.length - 1; i += 2) {
            // 读取16位采样值
            short sample = (short)(((audioData[i+1] & 0xFF) << 8) | (audioData[i] & 0xFF));
            
            if (sample == 0) {
                zeroCount++;
            } else if (sample > 0) {
                positiveCount++;
            } else {
                negativeCount++;
            }
            
            if (sample != 0) {
                nonZeroCount++;
            }
        }
        
        int totalSamples = audioData.length / 2;
        double zeroRatio = (double)zeroCount / totalSamples;
        double nonZeroRatio = (double)nonZeroCount / totalSamples;
        
        System.out.println("零采样比例: " + String.format("%.2f%%", zeroRatio * 100));
        System.out.println("非零采样比例: " + String.format("%.2f%%", nonZeroRatio * 100));
        
        // 显示前10个采样值
        System.out.print("前10个采样值: ");
        for (int i = 0; i < Math.min(20, audioData.length); i += 2) {
            short sample = (short)(((audioData[i+1] & 0xFF) << 8) | (audioData[i] & 0xFF));
            System.out.print(sample + " ");
        }
        System.out.println();
        
        // 计算RMS值（有效值）
        double sumSquares = 0;
        for (int i = 0; i < audioData.length - 1; i += 2) {
            short sample = (short)(((audioData[i+1] & 0xFF) << 8) | (audioData[i] & 0xFF));
            sumSquares += sample * sample;
        }
        double rms = Math.sqrt(sumSquares / totalSamples);
        System.out.println("音频RMS值: " + String.format("%.2f", rms));
        
        // 检查音频是否可能有效
        if (zeroRatio > 0.95) {
            System.out.println("警告: 音频数据中零值过多，可能转换失败");
        } else if (rms < 100) {
            System.out.println("警告: 音频信号可能太弱");
        } else {
            System.out.println("音频数据看起来有效");
        }
        
        System.out.println("=== 分析完成 ===");
    }

    /**
     * 测试音频格式检测功能
     * 用于检查M4A文件是否能被正确识别
     */
    public String testAudioFormatDetection(String filePath) {
        try {
            System.out.println("=== 音频格式检测测试: " + filePath + " ===");
            
            FileInputStream fileStream = new FileInputStream(filePath);
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            byte[] buffer = new byte[4096];
            int len;
            while ((len = fileStream.read(buffer)) != -1) {
                bos.write(buffer, 0, len);
            }
            fileStream.close();
            
            byte[] audioData = bos.toByteArray();
            System.out.println("文件大小: " + audioData.length + "字节");
            
            // 测试各种格式检测
            boolean isWav = isWavFormat(audioData);
            boolean isWebm = isWebmFormat(audioData);
            boolean isM4a = isM4aFormat(audioData);
            
            System.out.println("格式检测结果:");
            System.out.println("- WAV格式: " + isWav);
            System.out.println("- WebM格式: " + isWebm);
            System.out.println("- M4A格式: " + isM4a);
            
            // 检查文件签名
            System.out.println("文件前16个字节的十六进制:");
            for (int i = 0; i < Math.min(16, audioData.length); i++) {
                System.out.printf("%02X ", audioData[i]);
            }
            System.out.println();
            
            // 检查文件内容特征
            if (audioData.length > 100) {
                String first100Bytes = new String(audioData, 0, Math.min(100, audioData.length));
                System.out.println("文件前100字节的字符表示:");
                System.out.println(first100Bytes.replaceAll("[^\\x20-\\x7E]", "."));
            }
            
            // 尝试转换为PCM格式
            System.out.println("\n尝试转换为PCM格式...");
            FileInputStream stream = new FileInputStream(filePath);
            byte[] fileData = readAudioData(stream);
            stream.close();
            
            byte[] convertedPcm;
            try (ByteArrayInputStream freshStream = new ByteArrayInputStream(fileData)) {
                convertedPcm = audioConverter.processAudioToPcm(freshStream);
            } catch (Exception e) {
                System.err.println("PCM转换失败: " + e.getMessage());
                convertedPcm = new byte[0];
            }
            
            if (convertedPcm.length > 0) {
                System.out.println("PCM转换成功: " + convertedPcm.length + "字节");
                
                // 分析转换结果
                analyzeConvertedAudio(convertedPcm);
                
                String result = "文件大小: " + audioData.length + "字节\n" +
                                "WAV格式: " + isWav + "\n" +
                                "WebM格式: " + isWebm + "\n" +
                                "M4A格式: " + isM4a + "\n" +
                                "PCM转换成功: " + convertedPcm.length + "字节";
                
                return result;
            } else {
                System.out.println("PCM转换失败");
                
                String result = "文件大小: " + audioData.length + "字节\n" +
                                "WAV格式: " + isWav + "\n" +
                                "WebM格式: " + isWebm + "\n" +
                                "M4A格式: " + isM4a + "\n" +
                                "PCM转换失败";
                
                return result;
            }
            
        } catch (Exception e) {
            System.err.println("音频格式检测异常: " + e.getMessage());
            return "音频格式检测失败: " + e.getMessage();
        }
        
    }
}