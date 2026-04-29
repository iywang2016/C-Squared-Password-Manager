package com.c_squared.password_manager.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class MasterCredential {
  // The user's master username.
  @Id
  private String username;

  // The user's master password, salted and hashed
  // with SHA-256.
  private String hashedSaltedPass;

  // The salt used on hashedSaltedPass.
  private String salt;

  // Either an email address ([^\s]+@[^\s]+.[^\s]+)
  // or a phone number to use for 2-factor
  // authentication.
  private String authContact;
}