package com.c_squared.password_manager.service.dto;

import lombok.Data;
import lombok.RequiredArgsConstructor;

@Data
@RequiredArgsConstructor
public class MasterCredentialDTO {
  private final String pass;
  private final String salt;
  private final String auth;
}