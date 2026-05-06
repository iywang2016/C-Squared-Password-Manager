package com.c_squared.password_manager.service.dao;

import java.util.Set;
import java.util.HashSet;
import java.util.Optional;
import org.springframework.stereotype.Service;
import com.c_squared.password_manager.repository.UserDomainsRepository;
import com.c_squared.password_manager.model.UserDomains;

@Service
public class UserDomainsDAO {
  private final UserDomainsRepository userDomainsRepository;

  public UserDomainsDAO(UserDomainsRepository userDomainsRepository) {
    this.userDomainsRepository = userDomainsRepository;
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
  public Set<String> getUserDomains(String masterUsername) {
    Optional<UserDomains> domains = userDomainsRepository.findById(masterUsername);
    Set<String> userDomains = new HashSet<>();
    if (domains.isPresent()) {
      userDomains.addAll(domains.get().getDomains());
    }
    return userDomains;
  }
}