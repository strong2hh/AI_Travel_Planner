package com.ai_travel_planner.properities;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 科大讯飞语音服务配置类
 * 对应 application.yml 中的 iflytek.voice 前缀
 */
@Data
@Component
@ConfigurationProperties(prefix = "iflytek.voice")
public class IflytekProperities {

    /**
     * 对应配置文件中的 app-id
     * Spring Boot 会自动将 kebab-case (app-id) 映射为 camelCase (appId)
     */
    private String appId;

    /**
     * 对应配置文件中的 api-key
     */
    private String apiKey;

    /**
     * 对应配置文件中的 api-secret
     */
    private String apiSecret;
}