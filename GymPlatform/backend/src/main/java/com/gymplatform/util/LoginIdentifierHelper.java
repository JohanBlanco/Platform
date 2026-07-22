package com.gymplatform.util;

import com.gymplatform.config.DefaultAdminCredentials;
import com.gymplatform.domain.entity.User;
import com.gymplatform.repository.UserRepository;

import java.util.List;
import java.util.Optional;

public final class LoginIdentifierHelper {

    private LoginIdentifierHelper() {}

    public static Optional<User> resolveUser(UserRepository userRepository, String login) {
        if (login == null) {
            return Optional.empty();
        }
        String trimmed = login.trim();
        if (trimmed.isEmpty()) {
            return Optional.empty();
        }

        if (trimmed.contains("@")) {
            return activeUser(userRepository.findByEmailIgnoreCase(trimmed));
        }

        if (DefaultAdminCredentials.LOGIN.equalsIgnoreCase(trimmed)) {
            return activeUser(userRepository.findByEmailIgnoreCase(DefaultAdminCredentials.EMAIL));
        }

        String nationalId = NationalIdHelper.normalize(trimmed);
        if (!NationalIdHelper.isValid(nationalId)) {
            return Optional.empty();
        }

        List<User> users = userRepository.findAllByNationalId(nationalId);
        if (users.isEmpty()) {
            return Optional.empty();
        }
        if (users.size() > 1) {
            throw new IllegalStateException(
                    "Varias cuentas usan esa cédula. Inicia sesión con tu correo electrónico.");
        }

        return activeUser(Optional.of(users.get(0)));
    }

    private static Optional<User> activeUser(Optional<User> user) {
        return user.filter(User::isActive);
    }
}
