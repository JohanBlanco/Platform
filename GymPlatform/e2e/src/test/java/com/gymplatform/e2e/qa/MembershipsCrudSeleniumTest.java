package com.gymplatform.e2e.qa;

import com.gymplatform.e2e.pages.PackagesAdminPage;
import com.gymplatform.e2e.support.BaseSeleniumTest;
import com.gymplatform.e2e.support.TestCredentials;
import com.gymplatform.e2e.support.TestData;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

/** TC-MEMBERSHIPS-* — crear y editar membresías (eliminar no está en UI). */
class MembershipsCrudSeleniumTest extends BaseSeleniumTest {

    @Test
    @DisplayName("TC-MEMBERSHIPS-CRUD: crear y modificar membresía")
    void createAndEditMembership() {
        loginAs(TestCredentials.ADMIN_EMAIL, TestCredentials.ADMIN_PASSWORD);

        String name = "Membresía E2E " + TestData.suffix();
        String updatedName = name + " Plus";

        PackagesAdminPage packages = new PackagesAdminPage(driver, wait);
        packages.open(webBase());
        packages.clickCreateMembership();
        packages.fillMembership(name, "25000", "Plan de prueba E2E");
        packages.submitCreate();
        assertTrue(packages.listContainsMembership(name));

        packages.openMembershipByName(name);
        com.gymplatform.e2e.support.SeleniumHelpers.fillInputAfterLabel(driver, wait, "Nombre", updatedName);
        packages.submitSaveChanges();
        assertTrue(packages.listContainsMembership(updatedName));
    }
}
