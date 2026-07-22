package com.gymplatform.util;

import com.gymplatform.config.AppConstants;

public final class PasswordHelper {

    public static String resolve(String password) {
        if (password == null || password.isBlank()) {
            return AppConstants.DEFAULT_USER_PASSWORD;
        }
        return password;
    }

    private PasswordHelper() {}
}
