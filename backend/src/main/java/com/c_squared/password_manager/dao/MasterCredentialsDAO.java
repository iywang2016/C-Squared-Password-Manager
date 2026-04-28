package com.c_squared.password_manager.dao;

import org.apache.commons.lang3.tuple.Pair;

public class MasterCredentialsDAO {
  /**
   * Queries the MasterCredentials database and checks whether username
   * already exists as a primary key.
   * 
   * @param username username (primary key) of the entry to query
   * @return         true if the username exists; false otherwise
   */
  public static boolean checkMasterCredentialsExist(String username) {
    // TODO: implement
    return false;
  }

  /**
   * Adds a new entry or overrides the existing entry in the MasterCredentials
   * database, using username as the primary key.
   * 
   * @param username username (primary key) of the entry to add
   * @param pass     hashed and salted password to map to username
   * @param salt     salt used for pass
   * @param auth     either an email address ([^\s]+@[^\s]+.[^\s]+)
   *                 or phone number     
   */
  public static void addMasterCredentials(String username, String pass,
                                          String salt, String auth) {
    // TODO: implement
  }

  /**
   * Queries the MasterCredentials database and attempts to fetch the
   * salt and hashed & salted password associated with the username.
   * 
   * @param username username (primary key) of the entry to fetch
   * @return         [salt, hashed and salted password] corresponding
   *                 to the username if it exists; null otherwise
   */
  public static Pair<String, String> verifyMasterCredentials(String username) {
    // TODO: implement
    return null;
  }

  /**
   * Queries the MasterCredentials database and attempts to fetch the
   * 2FA contact associated with the username.
   * 
   * @param username username (primary key) of the entry to query
   * @return         either an email address ([^\s]+@[^\s]+.[^\s]+)
   *                 or phone number corresponding to the username
   *                 if it exists; null otherwise
   */
  public static String get2FA(String username) {
    // TODO: implement
    return null;
  }
}