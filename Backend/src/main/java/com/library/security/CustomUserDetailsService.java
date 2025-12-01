package com.library.security;

import com.library.model.entity.AppUser;
import com.library.repository.AppUserRepository;
import java.util.Collections;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

  private final AppUserRepository userRepository;

  public CustomUserDetailsService(AppUserRepository userRepository) {
    this.userRepository = userRepository;
  }

  @Transactional(readOnly = true)
  @Override
  public UserDetails loadUserByUsername(String email)
    throws UsernameNotFoundException {
    AppUser user = userRepository
      .findByEmail(email)
      .orElseThrow(() ->
        new UsernameNotFoundException("User not found: " + email)
      );

    if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
      throw new IllegalStateException(
        "User " + email + " does not have a password hash set."
      );
    }

    boolean enabled =
      user.getStatus() != null && "ACTIVE".equals(user.getStatus().name());
    String roleName = user.getRole() != null ? user.getRole().name() : "READER";
    SimpleGrantedAuthority authority = new SimpleGrantedAuthority(
      "ROLE_" + roleName
    );

    return new org.springframework.security.core.userdetails.User(
      user.getEmail(),
      user.getPasswordHash(),
      enabled,
      true, // accountNonExpired
      true, // credentialsNonExpired
      true, // accountNonLocked
      Collections.singletonList(authority)
    );
  }
}
