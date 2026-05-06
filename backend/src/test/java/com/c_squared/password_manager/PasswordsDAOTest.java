package com.c_squared.password_manager.service.dao;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.junit.jupiter.api.Assertions.*;
import com.c_squared.password_manager.config.TestConfig;

@SpringJUnitConfig(TestConfig.class)
public class PasswordsDAOTest {
  private PasswordsDAO passwordsDao;

  @Autowired
  public PasswordsDAOTest(PasswordsDAO passwordsDao) {
    this.passwordsDao = passwordsDao;
  }

  @Test
  void test_addCheckExists() {
    String masterUsername = "master user";
    String domain = "domain";
    String username = "user";
    String password = "password";
    passwordsDao.addNewPassword(masterUsername, domain, username, password);

    assertTrue(passwordsDao.checkPasswordExists(masterUsername, password),
               passwordsDao.getUserPasswords(masterUsername, domain).toString());
  }
}