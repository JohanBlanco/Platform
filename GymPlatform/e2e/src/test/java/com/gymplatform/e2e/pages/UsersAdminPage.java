package com.gymplatform.e2e.pages;

import com.gymplatform.e2e.support.SeleniumHelpers;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class UsersAdminPage {

    private final WebDriver driver;
    private final WebDriverWait wait;

    public UsersAdminPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    public void open(String webBase) {
        driver.get(webBase + "/reception/usuarios");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".admin-section")));
    }

    public void clickCreateUser() {
        wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//button[contains(@class,'admin-list-create-btn') and contains(.,'Crear Usuario')]"))).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("admin-form-modal-title")));
    }

    public void fillBasicUserForm(String firstName, String lastName, String email, String nationalId) {
        SeleniumHelpers.fillInputAfterLabel(driver, wait, "Nombre", firstName);
        SeleniumHelpers.fillInputAfterLabel(driver, wait, "Apellido", lastName);
        SeleniumHelpers.fillInputAfterLabel(driver, wait, "Cédula de identidad", nationalId);
        SeleniumHelpers.fillInputAfterLabel(driver, wait, "Correo de acceso", email);
        SeleniumHelpers.fillInputAfterLabel(driver, wait, "Contraseña", "12345678");
        WebElement whatsapp = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector(".admin-form-modal input[type='tel']")));
        whatsapp.click();
        whatsapp.sendKeys(org.openqa.selenium.Keys.chord(org.openqa.selenium.Keys.CONTROL, "a"));
        whatsapp.sendKeys("88887777");
    }

    public void selectFirstMembershipPlan() {
        var selects = driver.findElements(By.xpath("//label[contains(.,'Membresía')]/following::select[1]"));
        if (!selects.isEmpty()) {
            new org.openqa.selenium.support.ui.Select(selects.get(0)).selectByIndex(1);
        }
    }

    public void submitCreate() {
        WebElement submit = wait.until(ExpectedConditions.elementToBeClickable(
                By.cssSelector(".admin-form-modal button[type='submit']")));
        SeleniumHelpers.jsClick(driver, submit);
        wait.until(ExpectedConditions.invisibilityOfElementLocated(By.cssSelector(".admin-form-modal")));
    }

    public void waitUntilUserListed(String email) {
        wait.until(ExpectedConditions.textToBePresentInElementLocated(
                By.cssSelector(".admin-section"), email));
    }

    public void submitSaveChanges() {
        SeleniumHelpers.clickButton(driver, wait, "Guardar cambios");
        wait.until(ExpectedConditions.invisibilityOfElementLocated(By.cssSelector(".admin-form-modal")));
    }

    public void openUserByEmail(String email) {
        WebElement card = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//div[contains(@class,'card-selectable')][contains(.,'" + email + "')]")));
        card.click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("admin-form-modal-title")));
    }

    public boolean listContainsEmail(String email) {
        return SeleniumHelpers.pageContainsText(driver, email);
    }
}
