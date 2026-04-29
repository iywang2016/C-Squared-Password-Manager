package com.c_squared.password_manager.dao;

import java.util.Set;

public class UserDomainsDAO {
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
  public static Set<String> getUserPasswords(String masterUsername) {
    // TODO: implement
    return null;
  }
}