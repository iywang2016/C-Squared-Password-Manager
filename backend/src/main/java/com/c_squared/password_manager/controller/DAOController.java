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
import org.springframework.web.bind.annotation.RequestParam;
import com.c_squared.password_manager.service.dao.UserDomainsDAO;
import com.c_squared.password_manager.service.dao.PasswordsDAO;
import com.c_squared.password_manager.service.dao.MasterCredentialDAO;
import com.c_squared.password_manager.service.dto.NewLoginDTO;
import com.c_squared.password_manager.service.dto.MasterCredentialDTO;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.context.annotation.Bean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/database")
public class DAOController {
  private static final Logger logger = LoggerFactory.getLogger(DAOController.class);

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

  @GetMapping("get_domains/{masterUsername}/{masterPassword}")
  // public Set<String> getUserDomains(@PathVariable String masterUsername) {
  //   return userDomainsDao.getUserDomains(masterUsername);
  // }
  public Set<String> getUserDomains(@PathVariable String masterUsername, 
                                    @PathVariable String masterPassword) {
    return userDomainsDao.getUserDomains(masterUsername, masterPassword);
  }

  @PutMapping("add_domain/{masterUsername}/{domain}")
  public void addUserDomain(@PathVariable String masterUsername, @PathVariable String domain,
                            @RequestBody String masterPassword) {
    userDomainsDao.addUserDomain(masterUsername, domain, masterPassword);
  }

  @GetMapping("check_password_exists/{masterUsername}/{password}/{masterPassword}")
  public boolean checkPasswordExists(@PathVariable String masterUsername,
                                     @PathVariable String password,
                                     @PathVariable String masterPassword) {
    return passwordsDao.checkPasswordExists(masterUsername, password, masterPassword);
  }

  @GetMapping("/get_passwords/{masterUsername}/{domain}/{masterPassword}")
  public Map<String, String> getUserPasswords(@PathVariable String masterUsername,
                                              @PathVariable String domain,
                                              @PathVariable String masterPassword) {
    return passwordsDao.getUserPasswords(masterUsername, domain, masterPassword);
  }

  @PutMapping("/add_password/{masterUsername}/{domain}")
  public void addNewPassword(@PathVariable String masterUsername,
                             @PathVariable String domain,
                             @RequestBody NewLoginDTO newLogin) {
    passwordsDao.addNewPassword(masterUsername, domain,
                                newLogin.getUsername(), newLogin.getPasswordAndIv(), newLogin.getMasterPassword());
  }

  @GetMapping("check_master_exists/{masterUsername}")
  public boolean checkMasterCredentialsExist(@PathVariable String masterUsername) {
    return masterCredentialDao.checkMasterCredentialsExist(masterUsername);
  }

  @GetMapping("get_master/{masterUsername}/{masterPassword}")
  public boolean getMasterCredentials(@PathVariable String masterUsername,
                                                    @PathVariable String masterPassword) {
    return masterCredentialDao.getMasterCredentials(masterUsername, masterPassword);
  }

  @GetMapping("get_salt/{masterUsername}")
  public String getMasterSalt(@PathVariable String masterUsername) {
    return masterCredentialDao.getMasterSalt(masterUsername);
  }

  @GetMapping("get_auth/{masterUsername}/{masterPassword}")
  public String get2FA(@PathVariable String masterUsername, @PathVariable String masterPassword) {
    return masterCredentialDao.get2FA(masterUsername, masterPassword);
  }

  @PutMapping("add_master/{masterUsername}")
  public boolean  addMasterCredentials(@PathVariable String masterUsername,
                                       @RequestBody MasterCredentialDTO newMaster) {
    return masterCredentialDao.addMasterCredentials(masterUsername,
                                                    newMaster.getPass(),
                                                    newMaster.getSalt(),
                                                    newMaster.getAuth());
  }
}