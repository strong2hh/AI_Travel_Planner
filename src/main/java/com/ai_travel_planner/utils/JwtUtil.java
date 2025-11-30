package com.ai_travel_planner.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;
public class JwtUtil {

    /**
     * jwts生成
     * @param secretKey
     * @param ttlMillis
     * @param claims
     * @return
     */
    public static String createJWT(String secretKey, long ttlMillis, Map<String, Object> claims) {
        //1.设置签名算法
        SignatureAlgorithm signatureAlgorithm = SignatureAlgorithm.HS256;

        //2.设置截至日期
        long expmillis = System.currentTimeMillis() + ttlMillis;
        Date exp = new Date(expmillis);

        //3.生成jwt字符串
        JwtBuilder builder = Jwts.builder()
                .signWith(signatureAlgorithm,secretKey.getBytes(StandardCharsets.UTF_8))
                .setClaims(claims)
                .setExpiration(exp);

        return builder.compact();
    }

    /**
     * 解析jwt
     * @param secretKey
     * @param token
     * @return
     */
    public static Claims parseJWT(String secretKey, String token) {
        Claims claims = Jwts.parser()
                //通过secretKey生成密钥
                .setSigningKey(secretKey.getBytes(StandardCharsets.UTF_8))
                //比对生成的密钥和截止日期等信息，匹配后获取到jwt body中的claims
                .parseClaimsJws(token).getBody();
        return claims;
    }
}
