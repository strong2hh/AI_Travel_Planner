package com.ai_travel_planner;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
//@MapperScan("com.ai_travel_planner.mapper")
public class AiTravelPlannerApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiTravelPlannerApplication.class, args);
    }

}
