package com.ai_travel_planner.properities;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "travel.jwt")
public class JwtProperities {

    private String adminSecretKey;
    private long adminTtl;
    private String adminTokenName;
}
