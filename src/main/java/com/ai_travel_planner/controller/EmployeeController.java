package com.ai_travel_planner.controller;

import com.ai_travel_planner.DTO.EmployeeDTO;
import com.ai_travel_planner.entity.Employee;
import com.ai_travel_planner.properities.JwtProperities;
import com.ai_travel_planner.result.Result;
import com.ai_travel_planner.service.EmployeeService;
import com.ai_travel_planner.utils.JwtUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin/employee")
@CrossOrigin(origins = "*")
@Slf4j
public class EmployeeController {

    @Autowired
    private JwtProperities jwtProperities;
    @Autowired
    private EmployeeService employeeService;

    /**
     * 登录
     * @param employeeDTO
     * @return
     */
    @PostMapping("/login")
    public Result login(@RequestBody EmployeeDTO employeeDTO) {

        Employee employee = employeeService.login(employeeDTO);

        //用户不存在
        if(employee == null) {
            return Result.error("账号不存在，请先注册！");
        }
        //密码错误
        if(!employee.getPassword().equals(employeeDTO.getPassword())) {
            return Result.error("账号或密码错误！");
        }

        //创建claims
        Map<String,Object> claims = new HashMap<>();
        claims.put("user_id",employee.getId());
        String token = JwtUtil.createJWT(
                jwtProperities.getAdminSecretKey(),
                jwtProperities.getAdminTtl(),
                claims);

        return Result.success(token);
    }

    /**
     * 注册
     * @param employeeDTO
     * @return
     */
    @PostMapping("/signup")
    public Result signup(@RequestBody EmployeeDTO employeeDTO) {
        employeeService.signUp(employeeDTO);
        return Result.success();
    }
}