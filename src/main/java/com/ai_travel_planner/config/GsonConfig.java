package com.ai_travel_planner.config;

import com.ai_travel_planner.adapter.LocalDateAdapter;
import com.ai_travel_planner.adapter.LocalDateTimeAdapter;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import com.ai_travel_planner.adapter.LocalTimeAdapter;

@Configuration
public class GsonConfig {

    /**
     * Json到String转换
     * @return
     */
    @Bean
    public Gson gson() {
        return new GsonBuilder()
                .registerTypeAdapter(LocalTime.class, new LocalTimeAdapter())
                 .registerTypeAdapter(LocalDate.class, new LocalDateAdapter())
                 .registerTypeAdapter(LocalDateTime.class, new LocalDateTimeAdapter())
                .create();
    }
}