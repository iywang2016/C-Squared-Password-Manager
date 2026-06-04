package com.c_squared.password_manager.service.dao;

import java.util.Map;
import java.util.HashMap;
import java.util.Set;
import java.util.Optional;
import org.apache.commons.lang3.tuple.Pair;
import org.springframework.stereotype.Service;
import com.c_squared.password_manager.repository.PasswordsRepository;
import com.c_squared.password_manager.model.Passwords;

@Service
public class PasswordsDAO {
  private final PasswordsRepository passwordsRepository;
  private final UserDomainsDAO userDomainsDao;
  private final MasterCredentialDAO masterCredentialDao;

  public PasswordsDAO(PasswordsRepository passwordsRepository, UserDomainsDAO userDomainsDao,
                      MasterCredentialDAO masterCredentialDao) {
    this.passwordsRepository = passwordsRepository;
    this.userDomainsDao = userDomainsDao;
    this.masterCredentialDao = masterCredentialDao;
  }

  /**
   * Queries the Passwords database and checks whether this master user
   * has the given password on any of their logins on any domain.
   * 
   * @param masterUsername master username of the user whose credentials we
   *                       want to fetch
   * @param password       password (encrypted) we are mapping to this username
   * @return               true if the master user has already used this password
   *                       on any domain; false otherwise
   */
  public boolean checkPasswordExists(String masterUsername, String password, String masterPassword) {
    checkAuthorized(masterUsername, masterPassword);

    // Query UserDomains database to get all of the user's domains
    Set<String> domains = userDomainsDao.getUserDomains(masterUsername, masterPassword);
    for (String domain : domains) {
      Map<String, String> domainLogins = getUserPasswords(masterUsername, domain, masterPassword);
      if (domainLogins.values().contains(password)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Queries the Passwords database and attempts to fetch all usernames and
   * passwords under this master user on the specified domain.
   * 
   * @param masterUsername master username of the user whose credentials we
   *                       want to fetch
   * @param domain         domain name of the site for which we are fetching
   *                       credentials
   * @return               username -> encrypted password mappings under this
   *                       master user for this domain; may be empty if no
   *                       matching credentials are found
   */
  public Map<String, String> getUserPasswords(String masterUsername, String domain, String masterPassword) {
    checkAuthorized(masterUsername, masterPassword);

    String key = masterUsername + "#" + domain;
    Optional<Passwords> pwds = passwordsRepository.findById(key);
    Map<String, String> userToPass = new HashMap<>();
    if (pwds.isPresent()) {
      userToPass.putAll(pwds.get().getPasswords());
    }
    return userToPass;
  }

  /**
   * Adds a new entry or overrides the existing entry in the Passwords
   * database under the given master username and site domain.
   * 
   * @param masterUsername master username of the user whose credentials we
   *                       want to fetch
   * @param domain         domain name of the site for which we are fetching
   *                       credentials
   * @param username       username we are adding
   * @param password       password (encrypted) we are mapping to this username
   */
  public void addNewPassword(String masterUsername, String domain,
                             String username, String password, String masterPassword) {
    checkAuthorized(masterUsername, masterPassword);
    
    String key = masterUsername + "#" + domain;
    Optional<Passwords> pwds = passwordsRepository.findById(key);
    if (pwds.isPresent()) {
      // If this master username and domain already exists,
      // either override the current password for the username
      // or add a new username-password pair
      Passwords currPwds = pwds.get();
      currPwds.getPasswords().put(username, password);
      passwordsRepository.save(currPwds);
    } else {
      Map<String, String> userToPass = new HashMap<>();
      userToPass.put(username, password);
      Passwords newPwd = new Passwords(key, userToPass);
      passwordsRepository.save(newPwd);
    }
  }

  private boolean checkAuthorized(String masterUsername, String masterPassword) {
    // ensure user is authorized via master password
    return masterCredentialDao.getMasterCredentials(masterUsername, masterPassword);
  }
}