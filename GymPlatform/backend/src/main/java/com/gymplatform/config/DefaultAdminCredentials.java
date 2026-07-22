package com.gymplatform.config;

/** Credenciales del administrador bootstrap (todos los perfiles). */
public final class DefaultAdminCredentials {

    public static final String LOGIN = "gymplatformadmin";
    public static final String EMAIL = "gymplatformadmin@gymplatform.local";
    public static final String PASSWORD = "gymplatformadmin";
    public static final String NATIONAL_ID = "100000001";

    public static final String ORG_SLUG = "gymplatform";
    public static final String ORG_NAME = "GymPlatform";

    /** IDs reservados (demo FitLife usa 1–99). */
    public static final long ORG_ID = 100L;
    public static final long USER_ID = 100L;

    private DefaultAdminCredentials() {}
}
