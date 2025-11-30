package com.ai_travel_planner.Interceptor;

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

        //1.获取token
        String token = request.getHeader("token");

        //2.校验令牌
        try{
            log.info("校验令牌");
            Claims claims = JwtUtil.parseJWT(jwtProperities.getAdminSecretKey(),token);
            Long user_id = Long.valueOf(claims.get("user_id").toString());
            log.info("用户id为：{}",user_id);

            return true;
        }catch (Exception e){
            response.setStatus(401);
            return false;
        }
    }
}
