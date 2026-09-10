package com.bookbank.entity;

/**
 * Application roles. Spring Security expects the "ROLE_" prefix,
 * which is added automatically wherever we build authorities.
 */
public enum Role {
    ADMIN,
    LIBRARIAN,
    STUDENT
}
