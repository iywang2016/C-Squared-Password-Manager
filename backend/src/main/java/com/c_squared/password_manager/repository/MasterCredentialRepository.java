package com.c_squared.password_manager.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.c_squared.password_manager.model.MasterCredential;
import org.springframework.stereotype.Repository;

@Repository
public interface MasterCredentialRepository extends JpaRepository<MasterCredential, String> {
  Optional<MasterCredential> findById(String username);
}