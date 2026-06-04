package com.c_squared.password_manager.service.dto;

import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@RequiredArgsConstructor
public class NewLoginDTO {
  private final String username;
  private final String passwordAndIv;
  private final String masterPassword;
}