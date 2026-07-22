package com.gymplatform.e2e.pages;

import com.gymplatform.e2e.support.SeleniumHelpers;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

public class MemberAppointmentsPage {

    private final WebDriver driver;
    private final WebDriverWait wait;

    public MemberAppointmentsPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    public void open(String webBase) {
        driver.get(webBase + "/servicios/solicitudes-citas");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".member-citas-gcal")));
    }

    public boolean bookFirstAvailableSlot() {
        var slots = driver.findElements(By.cssSelector(
                ".member-citas-slot:not(.is-past):not(.member-citas-slot--mine)"));
        for (WebElement slot : slots) {
            if (!slot.isDisplayed() || !slot.isEnabled()) {
                continue;
            }
            slot.click();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".member-citas-book-modal")));
            new Select(driver.findElement(By.cssSelector(".member-citas-book-modal select"))).selectByVisibleText("Consulta");
            SeleniumHelpers.fillInputAfterLabel(driver, wait, "Nombre", "E2E");
            SeleniumHelpers.fillInputAfterLabel(driver, wait, "Apellidos", "Miembro");
            SeleniumHelpers.fillInputAfterLabel(driver, wait, "Dirección de correo electrónico", "e2e@test.local");
            SeleniumHelpers.clickButton(driver, wait, "Reservar");
            wait.until(ExpectedConditions.invisibilityOfElementLocated(By.cssSelector(".member-citas-book-modal")));
            return true;
        }
        return false;
    }

    public boolean hasBookedSlot() {
        return !driver.findElements(By.cssSelector(".member-citas-slot--mine")).isEmpty();
    }
}
