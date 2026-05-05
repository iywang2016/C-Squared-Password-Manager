package com.c_squared.password_manager.service.dao;

import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.apache.commons.lang3.tuple.Pair;
import com.c_squared.password_manager.repository.MasterCredentialRepository;
import com.c_squared.password_manager.model.MasterCredential;

@Service
public class MasterCredentialDAO { 
  private final MasterCredentialRepository masterCredentialRepository;

  public MasterCredentialDAO(MasterCredentialRepository masterCredentialRepository) {
    this.masterCredentialRepository = masterCredentialRepository;
  }

  /**
   * Queries the MasterCredentials database and checks whether username
   * already exists as a primary key.
   * 
   * @param username username (primary key) of the entry to query
   * @return         true if the username exists; false otherwise
   */
  public boolean checkMasterCredentialsExist(String username) {
    Optional<MasterCredential> mc = masterCredentialRepository.findById(username);
    return mc.isPresent();
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
  public void addMasterCredentials(String username, String pass,
                                          String salt, String auth) {
    MasterCredential mc = new MasterCredential(username, pass, salt, auth);
    masterCredentialRepository.save(mc);
  }

  /**
   * Queries the MasterCredentials database and attempts to fetch the
   * salt and hashed & salted password associated with the username.
   * 
   * @param username username (primary key) of the entry to fetch
   * @return         [salt, hashed and salted password] corresponding
   *                 to the username if it exists; null otherwise
   */
  public Pair<String, String> getMasterCredentials(String username) {
    Optional<MasterCredential> mc = masterCredentialRepository.findById(username);
    if (mc.isEmpty()) {
      return null;
    }
    return Pair.of(mc.get().getSalt(), mc.get().getHashedSaltedPass());
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
  public String get2FA(String username) {
    Optional<MasterCredential> mc = masterCredentialRepository.findById(username);
    if (mc.isEmpty()) {
      return null;
    }
    return mc.get().getAuthContact();
  }
}