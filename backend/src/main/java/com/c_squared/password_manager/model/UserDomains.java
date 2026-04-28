package com.c_squared.password_manager.model;

import java.util.Set;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.ElementCollection;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Entity
public class UserDomains {
  // The user's master username.
  @Id
  private String username;

  // All site domains on which the master user
  // has at least one login.
  @ElementCollection
  private Set<String> domains;
}