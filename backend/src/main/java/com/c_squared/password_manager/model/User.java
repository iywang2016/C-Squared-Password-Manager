package com.c_squared.password_manager.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users") // User is reserved I believe so we must name it users
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String authHash;

    @Column(nullable = false)
    private String salt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAuthHash() { return authHash; }
    public void setAuthHash(String authHash) { this.authHash = authHash; }

    public String getSalt() { return salt; }
    public void setSalt(String salt) { this.salt = salt; }
}