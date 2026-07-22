package com.gymplatform.e2e.qa;

import com.gymplatform.e2e.pages.AppShellPage;
import com.gymplatform.e2e.pages.LoginPage;
import com.gymplatform.e2e.support.BaseSeleniumTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.support.ui.ExpectedConditions;

import static org.junit.jupiter.api.Assertions.assertTrue;

/** TC-LOGIN-* — convertidos desde docs/qa/manual-test-scripts.md */
class LoginFlowSeleniumTest extends BaseSeleniumTest {

    @Test
    @DisplayName("TC-LOGIN-001: Administrador FitLife inicia sesión")
    void adminCanLogin() {
        new LoginPage(driver, wait).login(webBase(), "admin@fitlife.com", "12345678");

        new AppShellPage(driver, wait, webBase()).waitForAuthenticatedShell();
        assertNotOnLoginPage();
        assertTrue(new AppShellPage(driver, wait, webBase()).sidebarContainsText("Administración"));
    }

    @Test
    @DisplayName("TC-LOGIN-002: Credenciales inválidas permanecen en login")
    void invalidCredentialsStayOnLogin() {
        new LoginPage(driver, wait).login(webBase(), "admin@fitlife.com", "wrong-password");

        wait.until(ExpectedConditions.urlContains("/login"));
        assertTrue(driver.getCurrentUrl().contains("/login"));
    }

    @Test
    @DisplayName("TC-LOGIN-003: Bootstrap oculto puede iniciar sesión")
    void bootstrapAdminCanLogin() {
        new LoginPage(driver, wait).login(webBase(), "gymplatformadmin", "gymplatformadmin");

        new AppShellPage(driver, wait, webBase()).waitForAuthenticatedShell();
        assertNotOnLoginPage();
    }
}
