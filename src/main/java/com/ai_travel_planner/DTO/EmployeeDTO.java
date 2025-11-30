package com.ai_travel_planner.DTO;

import lombok.Data;

import java.io.Serializable;

@Data
public class EmployeeDTO implements Serializable {

    //用户名
    private String username;

    //密码
    private String password;
}
