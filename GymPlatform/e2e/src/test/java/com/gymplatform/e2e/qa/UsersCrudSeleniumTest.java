package com.gymplatform.e2e.qa;

import com.gymplatform.e2e.pages.UsersAdminPage;
import com.gymplatform.e2e.support.BaseSeleniumTest;
import com.gymplatform.e2e.support.SeleniumHelpers;
import com.gymplatform.e2e.support.TestCredentials;
import com.gymplatform.e2e.support.TestData;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

/** TC-USERS-* — crear y modificar usuarios (eliminar no está en UI). */
class UsersCrudSeleniumTest extends BaseSeleniumTest {

    @Test
    @DisplayName("TC-USERS-CRUD: crear usuario miembro y editarlo")
    void createAndEditUser() {
        loginAs(TestCredentials.ADMIN_EMAIL, TestCredentials.ADMIN_PASSWORD);

        String suffix = TestData.suffix();
        String email = TestData.uniqueEmail("e2e.user");
        String firstName = "E2E";
        String lastName = "Usuario" + suffix;
        String nationalId = TestData.uniqueNationalId();

        UsersAdminPage users = new UsersAdminPage(driver, wait);
        users.open(webBase());
        users.clickCreateUser();
        users.fillBasicUserForm(firstName, lastName, email, nationalId);
        users.selectFirstMembershipPlan();
        users.submitCreate();
        users.waitUntilUserListed(email);
        assertTrue(users.listContainsEmail(email), "El usuario creado debe aparecer en la lista");

        users.openUserByEmail(email);
        SeleniumHelpers.fillInputAfterLabel(driver, wait, "Apellido", lastName + "Edit");
        users.submitSaveChanges();
        assertTrue(users.listContainsEmail(email), "El usuario editado debe seguir en la lista");
        assertTrue(users.listContainsEmail(lastName + "Edit"), "Debe reflejarse el apellido editado");
    }
}
