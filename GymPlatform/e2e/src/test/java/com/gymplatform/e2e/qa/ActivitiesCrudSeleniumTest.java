package com.gymplatform.e2e.qa;

import com.gymplatform.e2e.pages.ActivitiesAdminPage;
import com.gymplatform.e2e.support.BaseSeleniumTest;
import com.gymplatform.e2e.support.TestCredentials;
import com.gymplatform.e2e.support.TestData;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** TC-ACTIVITIES-* — crear, editar y eliminar actividades. */
class ActivitiesCrudSeleniumTest extends BaseSeleniumTest {

    @Test
    @DisplayName("TC-ACTIVITIES-CRUD: crear, modificar y eliminar actividad")
    void createEditDeleteActivity() {
        loginAs(TestCredentials.RECEPTION_EMAIL, TestCredentials.RECEPTION_PASSWORD);

        String name = "Actividad E2E " + TestData.suffix();
        String updatedName = name + " Edit";

        ActivitiesAdminPage activities = new ActivitiesAdminPage(driver, wait);
        activities.open(webBase());
        activities.clickNewActivity();
        activities.fillBasicActivity(name, "Sala E2E");
        activities.submitCreate();
        activities.waitUntilActivityListed(name);

        activities.clickEditOnActivity(name);
        driver.findElement(org.openqa.selenium.By.id("activity-admin-name")).clear();
        driver.findElement(org.openqa.selenium.By.id("activity-admin-name")).sendKeys(updatedName);
        activities.submitSaveChanges();
        assertTrue(activities.listContainsActivity(updatedName));

        activities.clickDeleteOnActivity(updatedName);
        assertFalse(activities.listContainsActivity(updatedName));
    }
}
