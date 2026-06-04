package com.c_squared.password_manager.service.dao;

import java.util.Set;
import java.util.HashSet;
import java.util.Optional;
import org.apache.commons.lang3.tuple.Pair;
import org.springframework.stereotype.Service;
import com.c_squared.password_manager.repository.UserDomainsRepository;
import com.c_squared.password_manager.model.UserDomains;

@Service
public class UserDomainsDAO {
  private final UserDomainsRepository userDomainsRepository;
  private final MasterCredentialDAO masterCredentialDao;

  public UserDomainsDAO(UserDomainsRepository userDomainsRepository,
                        MasterCredentialDAO masterCredentialDao) {
    this.userDomainsRepository = userDomainsRepository;
    this.masterCredentialDao = masterCredentialDao;
  }

  /**
   * Queries the UserDomains database and attempts to fetch all domains on
   * which this master user has at least one login.
   * 
   * @param masterUsername master username of the user whose domains we
   *                       want to fetch
   * @return               all domains on which this master user has at
   *                       least one login; may be empty if no such
   *                       domains are found
   */
  public Set<String> getUserDomains(String masterUsername, String masterPassword) {
    if (!checkAuthorized(masterUsername, masterPassword)) {
      return null;
    }

    Optional<UserDomains> domains = userDomainsRepository.findById(masterUsername);
    Set<String> userDomains = new HashSet<>();
    if (domains.isPresent()) {
      userDomains.addAll(domains.get().getDomains());
    }
    return userDomains;
  }

  public void addUserDomain(String masterUsername, String domain, String masterPassword) {
    if (!checkAuthorized(masterUsername, masterPassword)) {
      return;
    }

    Optional<UserDomains> domains = userDomainsRepository.findById(masterUsername);
    if (domains.isPresent()) {
      UserDomains currDomains = domains.get();
      currDomains.getDomains().add(domain);
      userDomainsRepository.save(currDomains);
    } else {
      Set<String> userDomains = new HashSet<>();
      userDomains.add(domain);
      UserDomains newDomain = new UserDomains(masterUsername, userDomains);
      userDomainsRepository.save(newDomain);
    }
  }

  private boolean checkAuthorized(String masterUsername, String masterPassword) {
    // ensure user is authorized to do this
    return masterCredentialDao.getMasterCredentials(masterUsername, masterPassword);
  }
}