package com.c_squared.password_manager.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.c_squared.password_manager.model.Passwords;

public interface PasswordsRepository extends JpaRepository<Passwords, String> {
  Optional<Passwords> findById(String usernameAndDomain);
}