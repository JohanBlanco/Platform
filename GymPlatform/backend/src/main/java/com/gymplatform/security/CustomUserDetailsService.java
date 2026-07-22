package com.gymplatform.security;

import com.gymplatform.repository.UserRepository;
import com.gymplatform.util.LoginIdentifierHelper;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String login) throws UsernameNotFoundException {
        try {
            return LoginIdentifierHelper.resolveUser(userRepository, login)
                    .map(UserPrincipal::from)
                    .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + login));
        } catch (IllegalStateException ex) {
            throw new UsernameNotFoundException(ex.getMessage());
        }
    }
}
