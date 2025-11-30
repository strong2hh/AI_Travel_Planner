package com.ai_travel_planner.mapper;

import com.ai_travel_planner.entity.Employee;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface EmployeeMapper {

    /**
     * 登录
     * @param username
     * @return
     */
    @Select("SELECT * from employee where username = #{username}")
    Employee login(String username);

    /**
     * 注册
     * @param employee
     */
    void signUp(Employee employee);
}
