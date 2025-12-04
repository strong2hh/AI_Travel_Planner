package com.ai_travel_planner.service.Impl;

import com.ai_travel_planner.properities.IflytekProperities;
import com.ai_travel_planner.service.VoiceRecognitionService;
import com.ai_travel_planner.utils.AudioConverter;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class VoiceServiceImpl implements VoiceRecognitionService {

    private final AudioConverter audioConverter = new AudioConverter();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final IflytekProperities iflytekProperities;

    private static final String HOST_URL = "wss://iat-api.xfyun.cn/v2/iat";

    public VoiceServiceImpl(IflytekProperities iflytekProperities) {
        this.iflytekProperities = iflytekProperities;
    }
    @Override
    public String realTimeVoiceTranscription(InputStream audioStream) {
        if (iflytekProperities.getApiKey() == null || iflytekProperities.getApiSecret() == null ||
                iflytekProperities.getAppId() == null) {
            return "服务配置缺失";
        }

        try {
            // 1. 读取原始数据
            byte[] originalData = readAllBytes(audioStream);

            // 2. 格式转换 (WebM -> PCM 16k 16bit mono)
            // 核心简化：完全依赖 AudioConverter，不再在这里写手动的字节解析逻辑
            byte[] pcmData = audioConverter.processAudioToPcm(new ByteArrayInputStream(originalData));

            if (pcmData.length == 0) {
                return "音频转换失败或数据为空";
            }

            // 3. 调用 WebSocket
            return callWebSocketApi(pcmData);

        } catch (Exception e) {
            log.error("语音识别异常", e);
            return "识别失败: " + e.getMessage();
        }
    }

    private String callWebSocketApi(byte[] pcmData) throws Exception {
        // 构建鉴权 URL
        String authUrl = getAuthUrl(HOST_URL, iflytekProperities.getApiKey(), iflytekProperities.getApiSecret());

        CompletableFuture<String> resultFuture = new CompletableFuture<>();
        StringBuilder fullText = new StringBuilder();

        HttpClient client = HttpClient.newHttpClient();
        WebSocket webSocket = client.newWebSocketBuilder()
                .buildAsync(URI.create(authUrl), new WebSocket.Listener() {
                    @Override
                    public CompletionStage<?> onText(WebSocket webSocket, CharSequence data, boolean last) {
                        try {
                            JsonNode root = objectMapper.readTree(data.toString());
                            int code = root.path("code").asInt();

                            if (code != 0) {
                                resultFuture.complete("API错误: " + root.path("message").asText());
                                return null;
                            }

                            // 解析识别结果
                            JsonNode ws = root.path("data").path("result").path("ws");
                            if (!ws.isMissingNode()) {
                                for (JsonNode wordGroup : ws) {
                                    for (JsonNode cw : wordGroup.path("cw")) {
                                        fullText.append(cw.path("w").asText());
                                    }
                                }
                            }

                            // 判断是否结束
                            if (root.path("data").path("status").asInt() == 2) {
                                resultFuture.complete(fullText.toString());
                                webSocket.sendClose(WebSocket.NORMAL_CLOSURE, "Done");
                            }
                        } catch (Exception e) {
                            resultFuture.completeExceptionally(e);
                        }
                        return WebSocket.Listener.super.onText(webSocket, data, last);
                    }

                    @Override
                    public void onError(WebSocket webSocket, Throwable error) {
                        resultFuture.completeExceptionally(error);
                    }
                }).join();

        // 发送音频数据
        sendAudio(webSocket, pcmData);

        // 等待结果 (最多 30 秒)
        try {
            return resultFuture.get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            return "识别超时或出错";
        }
    }

    private void sendAudio(WebSocket webSocket, byte[] pcmData) {
        int chunkSize = 1280; // 每一帧的音频大小
        int offset = 0;

        while (offset < pcmData.length) {
            int end = Math.min(offset + chunkSize, pcmData.length);
            byte[] chunk = Arrays.copyOfRange(pcmData, offset, end);
            int status = (offset == 0) ? 0 : (end == pcmData.length ? 2 : 1); // 0:第一帧, 1:中间, 2:最后

            Map<String, Object> frame = new HashMap<>();

            // 构造第一帧的业务参数
            if (status == 0) {
                frame.put("common", Map.of("app_id", iflytekProperities.getAppId()));
                frame.put("business", Map.of("language", "zh_cn", "domain", "iat", "accent", "mandarin"));
            }

            // 构造数据参数
            Map<String, Object> dataMap = new HashMap<>();
            dataMap.put("status", status);
            dataMap.put("format", "audio/L16;rate=16000");
            dataMap.put("encoding", "raw");
            dataMap.put("audio", Base64.getEncoder().encodeToString(chunk));
            frame.put("data", dataMap);

            try {
                webSocket.sendText(objectMapper.writeValueAsString(frame), true);
                Thread.sleep(40); // 模拟实时发送间隔
            } catch (Exception e) {
                log.error("发送音频帧失败", e);
                break;
            }
            offset = end;
        }
    }

    // 鉴权 URL 生成
    private String getAuthUrl(String hostUrl, String apiKey, String apiSecret) throws Exception {
        URI url = new URI(hostUrl);
        SimpleDateFormat sdf = new SimpleDateFormat("EEE, dd MMM yyyy HH:mm:ss z", Locale.US);
        sdf.setTimeZone(TimeZone.getTimeZone("GMT"));
        String date = sdf.format(new Date());

        String builder = "host: " + url.getHost() + "\n" +
                "date: " + date + "\n" +
                "GET " + url.getPath() + " HTTP/1.1";

        Mac mac = Mac.getInstance("hmacsha256");
        mac.init(new SecretKeySpec(apiSecret.getBytes(StandardCharsets.UTF_8), "hmacsha256"));
        byte[] sha = mac.doFinal(builder.getBytes(StandardCharsets.UTF_8));
        String signature = Base64.getEncoder().encodeToString(sha);

        String authorization = String.format("api_key=\"%s\", algorithm=\"hmac-sha256\", headers=\"host date request-line\", signature=\"%s\"", apiKey, signature);

        return String.format("%s?authorization=%s&date=%s&host=%s",
                hostUrl,
                Base64.getEncoder().encodeToString(authorization.getBytes(StandardCharsets.UTF_8)),
                URLEncoder.encode(date, StandardCharsets.UTF_8),
                URLEncoder.encode(url.getHost(), StandardCharsets.UTF_8)
        );
    }

    private byte[] readAllBytes(InputStream is) throws Exception {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        int nRead;
        byte[] data = new byte[4096];
        while ((nRead = is.read(data, 0, data.length)) != -1) {
            buffer.write(data, 0, nRead);
        }
        return buffer.toByteArray();
    }
}