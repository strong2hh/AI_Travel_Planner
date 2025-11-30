package com.ai_travel_planner.service;


import com.ai_travel_planner.DTO.EmployeeDTO;
import com.ai_travel_planner.entity.Employee;

public interface EmployeeService {

    /**
     * 登录
     * @param employeeDTO
     * @return
     */
    Employee login(EmployeeDTO employeeDTO);

    /**
     * 注册
     * @param employeeDTO
     * @return
     */
    void signUp(EmployeeDTO employeeDTO);
}
