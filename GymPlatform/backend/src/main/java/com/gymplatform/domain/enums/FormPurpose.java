package com.gymplatform.domain.enums;

public enum FormPurpose {
    /** Historial / ingreso al gimnasio (expediente). No eliminable. */
    MEMBER_REGISTRATION,
    /** Alta pública de usuario (crea cuenta MEMBER). No eliminable. */
    MEMBER_SIGNUP,
    /** Alta + registro en un solo envío (crea usuario y guarda expediente). No eliminable. */
    MEMBER_ONBOARDING,
    /** Formulario creado por el gimnasio. */
    CUSTOM;

    public boolean isSystemProtected() {
        return this != CUSTOM;
    }

    public boolean createsUserOnSubmit() {
        return this == MEMBER_SIGNUP || this == MEMBER_ONBOARDING;
    }
}
