package com.c_squared.password_manager.controller;

import java.util.Set;
import java.util.Map;
import org.apache.commons.lang3.tuple.Pair;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.c_squared.password_manager.service.dao.UserDomainsDAO;
import com.c_squared.password_manager.service.dao.PasswordsDAO;
import com.c_squared.password_manager.service.dao.MasterCredentialDAO;
import com.c_squared.password_manager.service.dto.NewLoginDTO;
import com.c_squared.password_manager.service.dto.MasterCredentialDTO;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.context.annotation.Bean;

@RestController
@RequestMapping("/database")
public class DAOController {
  private final UserDomainsDAO userDomainsDao;
  private final PasswordsDAO passwordsDao;
  private final MasterCredentialDAO masterCredentialDao;

  public DAOController(UserDomainsDAO userDomainsDao,
                       PasswordsDAO passwordsDao,
                       MasterCredentialDAO masterCredentialDao) {
    this.userDomainsDao = userDomainsDao;
    this.passwordsDao = passwordsDao;
    this.masterCredentialDao = masterCredentialDao;
  }

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
      http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
        .csrf(AbstractHttpConfigurer::disable);
      return http.build();
  }

  @GetMapping("domains/{masterUsername}")
  public Set<String> getUserDomains(@PathVariable String masterUsername) {
    return userDomainsDao.getUserDomains(masterUsername);
  }

  @GetMapping("check_password_exists/{masterUsername}/{password}")
  public boolean checkPasswordExists(@PathVariable String masterUsername,
                                     @PathVariable String password) {
    return passwordsDao.checkPasswordExists(masterUsername, password);
  }

  @GetMapping("/get_passwords/{masterUsername}/{domain}")
  public Map<String, String> getUserPasswords(@PathVariable String masterUsername,
                                              @PathVariable String domain) {
    return passwordsDao.getUserPasswords(masterUsername, domain);
  }

  @PutMapping("/add_password/{masterUsername}/{domain}")
  public void addNewPassword(@PathVariable String masterUsername,
                             @PathVariable String domain,
                             @RequestBody NewLoginDTO newLogin) {
    passwordsDao.addNewPassword(masterUsername, domain,
                                newLogin.getUsername(), newLogin.getPassword());
  }

  @GetMapping("check_master_exists/{masterUsername}")
  public boolean checkMasterCredentialsExist(@PathVariable String masterUsername) {
    return masterCredentialDao.checkMasterCredentialsExist(masterUsername);
  }

  @GetMapping("get_master/{masterUsername}")
  public Pair<String, String> getMasterCredentials(@PathVariable String masterUsername) {
    return masterCredentialDao.getMasterCredentials(masterUsername);
  }

  @GetMapping("get_auth/{masterUsername}")
  public String get2FA(@PathVariable String masterUsername) {
    return masterCredentialDao.get2FA(masterUsername);
  }

  @PutMapping("add_master/{masterUsername}")
  public void addMasterCredentials(@PathVariable String masterUsername,
                                   @RequestBody MasterCredentialDTO newMaster) {
    masterCredentialDao.addMasterCredentials(masterUsername,
                                             newMaster.getPass(),
                                             newMaster.getSalt(),
                                             newMaster.getAuth());
  }
}