package com.gymplatform.e2e.pages;

import com.gymplatform.e2e.support.SeleniumHelpers;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class PackagesAdminPage {

    private final WebDriver driver;
    private final WebDriverWait wait;

    public PackagesAdminPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    public void open(String webBase) {
        driver.get(webBase + "/reception/membresias");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".admin-section")));
    }

    public void clickCreateMembership() {
        wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//button[contains(@class,'admin-list-create-btn') and contains(.,'Crear Membresía')]"))).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("admin-form-modal-title")));
    }

    public void fillMembership(String name, String price, String description) {
        SeleniumHelpers.fillInputAfterLabel(driver, wait, "Nombre", name);
        SeleniumHelpers.fillInputAfterLabel(driver, wait, "Precio mensual", price);
        SeleniumHelpers.fillTextareaAfterLabel(driver, wait, "Descripción", description);
    }

    public void submitCreate() {
        SeleniumHelpers.clickButton(driver, wait, "Crear membresía");
        wait.until(ExpectedConditions.invisibilityOfElementLocated(By.cssSelector(".admin-form-modal")));
    }

    public void submitSaveChanges() {
        SeleniumHelpers.clickButton(driver, wait, "Guardar cambios");
        wait.until(ExpectedConditions.invisibilityOfElementLocated(By.cssSelector(".admin-form-modal")));
    }

    public void openMembershipByName(String name) {
        WebElement card = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//div[contains(@class,'card-selectable')][contains(.,'" + name + "')]")));
        card.click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("admin-form-modal-title")));
    }

    public boolean listContainsMembership(String name) {
        return SeleniumHelpers.pageContainsText(driver, name);
    }
}
