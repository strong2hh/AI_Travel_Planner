package com.ai_travel_planner.config;

import com.alibaba.cloud.ai.dashscope.api.DashScopeApi;
import com.alibaba.cloud.ai.dashscope.chat.DashScopeChatModel;
import com.alibaba.cloud.ai.dashscope.chat.DashScopeChatOptions;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LLMConfig {

    private final String DEEPSEEK_MODEL = "deepseek-v3";
    private final String QWEN_MODEL = "qwen-plus";

    @Value("${spring.ai.dashscope.api-key}")
    private String LLMApiKey;
    /**
     * deepseek-ChatModel
     * @return
     */
    @Bean(name = "deepseekChatModel")
    public ChatModel deepseekChatModel() {
        return DashScopeChatModel.builder()
                .dashScopeApi(DashScopeApi.builder()
                        .apiKey(LLMApiKey)
                        .build())
                .defaultOptions(DashScopeChatOptions.builder()
                        .withModel(DEEPSEEK_MODEL)
                        .build())
                .build();
    }

    /**
     * qwen-ChatModel
     * @return
     */
    @Bean(name = "qwenChatModel")
    public ChatModel qwenChatModel() {
        return DashScopeChatModel.builder()
                .dashScopeApi(DashScopeApi.builder()
                        .apiKey(LLMApiKey)
                        .build())
                .defaultOptions(DashScopeChatOptions.builder()
                        .withModel(QWEN_MODEL)
                        .build())
                .build();
    }

    /**
     * deepseek-ChatClient
     * @return
     */
    @Bean(name = "deepseekChatClient")
    public ChatClient deepseekChatClient() {
        return ChatClient.builder(deepseekChatModel()).build();
    }

    /**
     * qwen-ChatClient
     * @return
     */
    @Bean(name = "qwenChatClient")
    public ChatClient qwenChatClient() {
        return ChatClient.builder(qwenChatModel()).build();
    }
}
