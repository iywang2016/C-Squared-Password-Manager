package com.c_squared.password_manager.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.c_squared.password_manager.model.UserDomains;

@Repository
public interface UserDomainsRepository extends JpaRepository<UserDomains, String> {
  Optional<UserDomains> findById(String username);
}