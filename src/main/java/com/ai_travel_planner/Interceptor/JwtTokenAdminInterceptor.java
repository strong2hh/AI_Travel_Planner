package com.ai_travel_planner.Interceptor;

import com.ai_travel_planner.constant.BaseContext;
import com.ai_travel_planner.properities.JwtProperities;
import com.ai_travel_planner.utils.JwtUtil;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import static org.springframework.boot.context.properties.source.ConfigurationPropertyName.isValid;

@Component
@Slf4j
public class JwtTokenAdminInterceptor implements HandlerInterceptor
{
    @Autowired
    private JwtProperities jwtProperities;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception
    {
        if(!(handler instanceof HandlerMethod)){
            return true;
        }

        // 获取请求URI
        String requestURI = request.getRequestURI();

        // 尝试获取Token
        String token = request.getHeader("token"); // 你的前端使用的是自定义的 'token' Header

        // 输出更详细的日志
        log.info("校验令牌 | URI: {} | Token: {}", requestURI, token);

        //2.校验令牌
        try{
            //无token
            if (token == null) {
                // 1. 执行重定向
                response.sendRedirect("/auth/auth.html");

                // 2. 返回 false，阻止请求继续执行到 Controller
                return false;
            }

            Claims claims = JwtUtil.parseJWT(jwtProperities.getAdminSecretKey(),token);
            Long user_id = Long.valueOf(claims.get("user_id").toString());
            log.info("用户id为：{}",user_id);
            BaseContext.setCurrentId(user_id);

            return true;
        }catch (Exception e){
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            return false;
        }
    }
}
