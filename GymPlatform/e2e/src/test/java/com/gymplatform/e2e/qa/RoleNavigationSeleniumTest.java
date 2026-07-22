package com.gymplatform.e2e.qa;

import com.gymplatform.e2e.pages.AppShellPage;
import com.gymplatform.e2e.pages.LoginPage;
import com.gymplatform.e2e.support.BaseSeleniumTest;
import com.gymplatform.e2e.support.TestCredentials;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** TC-ROLE-* y TC-NAV-* — perfiles y navegación por rol */
class RoleNavigationSeleniumTest extends BaseSeleniumTest {

    @Test
    @DisplayName("TC-MEMBER-001: Miembro ve sección Servicios")
    void memberSeesMemberNav() {
        new LoginPage(driver, wait).login(webBase(), TestCredentials.MEMBER_EMAIL, TestCredentials.MEMBER_PASSWORD);
        AppShellPage shell = new AppShellPage(driver, wait, webBase());
        shell.waitForAuthenticatedShell();

        assertTrue(shell.sidebarContainsText("Reservaciones")
                || shell.sidebarContainsText("Rutinas"));
    }

    @Test
    @DisplayName("TC-ROLE-001: Admin cambia a perfil Miembro")
    void adminSwitchesToMemberProfile() {
        new LoginPage(driver, wait).login(webBase(), TestCredentials.ADMIN_EMAIL, TestCredentials.ADMIN_PASSWORD);
        AppShellPage shell = new AppShellPage(driver, wait, webBase());
        shell.waitForAuthenticatedShell();

        shell.switchToProfile("Miembro");
        assertTrue(shell.sidebarContainsText("Rutinas") || shell.sidebarContainsText("Reservaciones"));
    }

    @Test
    @DisplayName("TC-RECEP-001: Recepcionista no ve Estadísticas")
    void receptionistCannotSeeStatisticsNav() {
        new LoginPage(driver, wait).login(webBase(), TestCredentials.RECEPTION_EMAIL, TestCredentials.RECEPTION_PASSWORD);
        AppShellPage shell = new AppShellPage(driver, wait, webBase());
        shell.waitForAuthenticatedShell();

        assertFalse(shell.sidebarContainsText("Estadísticas"));
    }

    @Test
    @DisplayName("TC-LOGOUT-001: Cerrar sesión vuelve al login")
    void logoutReturnsToLogin() {
        new LoginPage(driver, wait).login(webBase(), TestCredentials.ADMIN_EMAIL, TestCredentials.ADMIN_PASSWORD);
        AppShellPage shell = new AppShellPage(driver, wait, webBase());
        shell.waitForAuthenticatedShell();
        shell.logout();

        assertTrue(driver.getCurrentUrl().contains("/login"));
    }
}
