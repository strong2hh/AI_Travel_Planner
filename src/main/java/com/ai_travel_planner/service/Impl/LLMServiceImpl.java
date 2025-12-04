package com.ai_travel_planner.service.Impl;

import com.ai_travel_planner.DTO.ScheduleDTO;
import com.ai_travel_planner.constant.TravelPlannerConstants;
import com.ai_travel_planner.entity.Schedule;
import com.ai_travel_planner.result.Result;
import com.ai_travel_planner.service.LLMService;
import com.ai_travel_planner.service.ScheduleService;
import com.ai_travel_planner.utils.JSONParserUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 阿里云大模型服务实现类
 * 基于阿里云DashScope API实现大模型服务功能
 */
@Service
@Slf4j
public class LLMServiceImpl implements LLMService {

    @Autowired
    @Qualifier("deepseekChatModel")
    private ChatModel deepseekChatModel;
    @Autowired
    @Qualifier("qwenChatModel")
    private ChatModel qwenChatModel;
    @Autowired
    @Qualifier("deepseekChatClient")
    private ChatClient deepseekChatClient;
    @Autowired
    @Qualifier("qwenChatClient")
    private ChatClient qwenChatClient;
    @Autowired
    private ScheduleService scheduleService;
    @Autowired
    private JSONParserUtil jsonParserUtil;
    /**
     * 调用AI模型生成回复
     *
     * @param query 用户输入的查询内容
     * @return AI模型的回复结果
     */
    @Override
    public Result<String> generateResponse(String query) {
        if (query == null || query.trim().isEmpty()) {
            // 对于错误，无法返回 Flux，因此返回一个同步的错误响应
            return Result.error("用户查询内容不能为空。");
        }

        try {
            String modelResponse = qwenChatClient.prompt()
                    .system(TravelPlannerConstants.SYSTEM_PROMPT)
                    .user(query)
                    .call()
                    .content();

            log.info("AI服务响应成功 - 已建立连接");
            //测试大模型返回结果是否正常
            log.info("大模型返回结果为：{}" ,modelResponse);

            ScheduleDTO scheduleDTO = jsonParserUtil.parseJson(modelResponse);
            scheduleService.insertSchedule(scheduleDTO);

            return Result.success(modelResponse);

        } catch (Exception e) {
            log.error("大模型服务调用失败 - 错误: {}", e.getMessage(), e);

            // 返回 500 错误，并在响应体中包含错误信息
            return Result.error("大模型服务调用失败，请检查API密钥或网络连接。");
        }
    }
}