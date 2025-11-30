package com.ai_travel_planner.service.Impl;

import com.ai_travel_planner.DTO.EmployeeDTO;
import com.ai_travel_planner.entity.Employee;
import com.ai_travel_planner.mapper.EmployeeMapper;
import com.ai_travel_planner.service.EmployeeService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class EmployeeServiceImpl implements EmployeeService {

    @Autowired
    private EmployeeMapper employeeMapper;

    /**
     * 登录
     * @param employeeDTO
     * @return
     */
    @Override
    public Employee login(EmployeeDTO employeeDTO) {
        return employeeMapper.login(employeeDTO.getUsername());
    }

    /**
     * 注册
     * @param employeeDTO
     * @return
     */
    @Override
    public void signUp(EmployeeDTO employeeDTO) {
        Employee employee = new Employee();
        BeanUtils.copyProperties(employeeDTO,employee);
        employeeMapper.signUp(employee);
    }
}
