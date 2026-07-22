package com.gymplatform.util;

import com.gymplatform.config.DefaultAdminCredentials;
import com.gymplatform.domain.entity.User;
import com.gymplatform.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoginIdentifierHelperTest {

    @Mock
    private UserRepository userRepository;

    @Test
    void resolvesByEmail() {
        User user = activeUser("admin@gymplatform.local");
        when(userRepository.findByEmailIgnoreCase("admin@gymplatform.local")).thenReturn(Optional.of(user));

        Optional<User> found = LoginIdentifierHelper.resolveUser(userRepository, "admin@gymplatform.local");

        assertTrue(found.isPresent());
        assertEquals("admin@gymplatform.local", found.get().getEmail());
    }

    @Test
    void resolvesBootstrapLoginWithoutAtSign() {
        User bootstrap = activeUser(DefaultAdminCredentials.EMAIL);
        when(userRepository.findByEmailIgnoreCase(DefaultAdminCredentials.EMAIL)).thenReturn(Optional.of(bootstrap));

        Optional<User> found = LoginIdentifierHelper.resolveUser(userRepository, DefaultAdminCredentials.LOGIN);

        assertTrue(found.isPresent());
        verify(userRepository, never()).findAllByNationalId(anyString());
    }

    @Test
    void resolvesByNationalId() {
        User user = activeUser("miembro@gymplatform.local");
        user.setNationalId("190205678");
        when(userRepository.findAllByNationalId("190205678")).thenReturn(List.of(user));

        Optional<User> found = LoginIdentifierHelper.resolveUser(userRepository, "1-902-05678");

        assertTrue(found.isPresent());
    }

    @Test
    void rejectsInactiveUser() {
        User inactive = activeUser("admin@gymplatform.local");
        inactive.setActive(false);
        when(userRepository.findByEmailIgnoreCase("admin@gymplatform.local")).thenReturn(Optional.of(inactive));

        assertTrue(LoginIdentifierHelper.resolveUser(userRepository, "admin@gymplatform.local").isEmpty());
    }

    @Test
    void rejectsDuplicateNationalId() {
        when(userRepository.findAllByNationalId("190205678"))
                .thenReturn(List.of(activeUser("a@x.com"), activeUser("b@x.com")));

        assertThrows(IllegalStateException.class,
                () -> LoginIdentifierHelper.resolveUser(userRepository, "190205678"));
    }

    private static User activeUser(String email) {
        User user = new User();
        user.setEmail(email);
        user.setActive(true);
        return user;
    }
}
