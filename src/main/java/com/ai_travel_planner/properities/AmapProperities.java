package com.ai_travel_planner.properities;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "amap")
public class AmapProperities {
    private String apiKey;
    private String apiSecret;
}
