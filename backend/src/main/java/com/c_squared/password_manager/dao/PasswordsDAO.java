package com.c_squared.password_manager.dao;

import java.util.Map;

public class PasswordsDAO {
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
  public static boolean checkPasswordExists(String masterUsername, String password) {
    // TODO: implement
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
  public static Map<String, String> getUserPasswords(String masterUsername, String domain) {
    // TODO: implement
    return null;
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
  public static void addNewPassword(String masterUsername, String domain,
                                    String username, String password) {
    // TODO: implement
  }
}