package com.gymplatform.e2e.pages;

import com.gymplatform.e2e.support.SeleniumHelpers;
import com.gymplatform.e2e.support.TestData;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

public class ActivitiesAdminPage {

    private final WebDriver driver;
    private final WebDriverWait wait;

    public ActivitiesAdminPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    public void open(String webBase) {
        driver.get(webBase + "/reception/actividades");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".activities-admin")));
        wait.until(ExpectedConditions.presenceOfElementLocated(
                By.cssSelector(".activity-admin-card, .activities-admin .empty-state, .admin-list-toolbar")));
    }

    public void clickNewActivity() {
        WebElement createBtn = wait.until(ExpectedConditions.elementToBeClickable(
                By.cssSelector(".activities-admin .admin-list-create-btn")));
        SeleniumHelpers.scrollIntoView(driver, createBtn);
        SeleniumHelpers.jsClick(driver, createBtn);
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".admin-form-modal")));
    }

    public void fillBasicActivity(String name, String location) {
        WebElement nameInput = wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("activity-admin-name")));
        nameInput.clear();
        nameInput.sendKeys(name);
        if (location != null && !location.isBlank()) {
            WebElement locationInput = driver.findElement(By.id("activity-admin-location"));
            locationInput.clear();
            locationInput.sendKeys(location);
        }
        WebElement timeInput = driver.findElement(By.id("activity-admin-time"));
        timeInput.clear();
        timeInput.sendKeys("05:00");
    }

    public void submitCreate() {
        WebElement submit = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//div[contains(@class,'admin-form-modal')]//button[@type='submit'"
                        + " and normalize-space()='Crear actividad' and not(@disabled)]")));
        SeleniumHelpers.jsClick(driver, submit);
        wait.until(ExpectedConditions.or(
                ExpectedConditions.invisibilityOfElementLocated(By.cssSelector(".admin-form-modal")),
                ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".toast-error"))));
        if (!driver.findElements(By.cssSelector(".toast-error")).isEmpty()) {
            throw new IllegalStateException("Error al crear actividad: "
                    + driver.findElement(By.cssSelector(".toast-error")).getText());
        }
    }

    public void waitUntilActivityListed(String name) {
        wait.until(ExpectedConditions.textToBePresentInElementLocated(
                By.cssSelector(".activities-admin"), name));
    }

    public void submitSaveChanges() {
        SeleniumHelpers.clickButton(driver, wait, "Guardar cambios");
        wait.until(ExpectedConditions.invisibilityOfElementLocated(By.cssSelector(".admin-form-modal")));
    }

    public void clickEditOnActivity(String name) {
        WebElement card = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//div[contains(@class,'activity-admin-card')][contains(.,'" + name + "')]")));
        card.findElement(By.xpath(".//button[contains(.,'Editar')]")).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("activity-admin-name")));
    }

    public void clickDeleteOnActivity(String name) {
        WebElement card = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//div[contains(@class,'activity-admin-card')][contains(.,'" + name + "')]")));
        card.findElement(By.xpath(".//button[contains(.,'Eliminar')]")).click();
        new ConfirmDialogPage(driver, wait).confirmDelete();
    }

    public boolean listContainsActivity(String name) {
        return !driver.findElements(By.xpath("//div[contains(@class,'activity-admin-card')][contains(.,'" + name + "')]")).isEmpty();
    }
}
