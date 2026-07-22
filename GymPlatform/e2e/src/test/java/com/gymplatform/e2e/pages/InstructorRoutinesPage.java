package com.gymplatform.e2e.pages;

import com.gymplatform.e2e.support.SeleniumHelpers;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class InstructorRoutinesPage {

    private final WebDriver driver;
    private final WebDriverWait wait;

    public InstructorRoutinesPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    public void open(String webBase) {
        driver.get(webBase + "/training/rutinas");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".routines-admin-tabs")));
    }

    public void openRequestsTab() {
        SeleniumHelpers.clickButtonContaining(driver, wait, "Solicitudes");
    }

    public void openTemplatesTab() {
        SeleniumHelpers.clickButtonContaining(driver, wait, "Plantillas");
    }

    public void ensureAtLeastOneTemplate(String templateName) {
        openTemplatesTab();
        wait.until(ExpectedConditions.or(
                ExpectedConditions.presenceOfElementLocated(
                        By.xpath("//div[contains(@class,'empty-state') and contains(.,'No hay plantillas')]")),
                ExpectedConditions.presenceOfElementLocated(By.cssSelector(".card-selectable"))));
        if (!driver.findElements(
                By.xpath("//div[contains(@class,'empty-state') and contains(.,'No hay plantillas')]")).isEmpty()) {
            createMinimalTemplate(templateName);
        }
    }

    private void createMinimalTemplate(String templateName) {
        WebElement createBtn = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//button[contains(.,'+ Nueva plantilla')]")));
        SeleniumHelpers.jsClick(driver, createBtn);
        wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//h3[contains(.,'Nueva plantilla de rutina')]")));
        WebElement nameInput = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//label[contains(.,'Nombre de la plantilla')]/following::input[1]")));
        nameInput.clear();
        nameInput.sendKeys(templateName);
        new org.openqa.selenium.support.ui.Select(
                driver.findElement(By.xpath("//label[contains(.,'Días por semana')]/following::select[1]")))
                .selectByValue("1");
        WebElement dayExerciseInput = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector(".routine-day-exercises .exercise-list-add input")));
        dayExerciseInput.sendKeys("Flexiones E2E");
        WebElement addExerciseBtn = driver.findElement(
                By.cssSelector(".routine-day-exercises .exercise-list-add button[type='submit']"));
        SeleniumHelpers.jsClick(driver, addExerciseBtn);
        wait.until(ExpectedConditions.presenceOfElementLocated(
                By.cssSelector(".routine-day-exercises .exercise-list-item-name")));
        SeleniumHelpers.clickButton(driver, wait, "Guardar plantilla");
        wait.until(ExpectedConditions.invisibilityOfElementLocated(
                By.xpath("//h3[contains(.,'Nueva plantilla de rutina')]")));
    }

    public boolean assignTemplateToFirstRequest() {
        ensureAtLeastOneTemplate("Plantilla E2E " + System.currentTimeMillis() % 1_000_000L);
        openRequestsTab();
        var cards = driver.findElements(By.cssSelector(".routine-request-card"));
        if (cards.isEmpty()) {
            return false;
        }
        cards.get(0).findElement(By.xpath(".//button[contains(.,'Asignar rutina')]")).click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("assign-routine-title")));
        WebElement template = wait.until(ExpectedConditions.elementToBeClickable(
                By.cssSelector(".template-pick-item")));
        SeleniumHelpers.jsClick(driver, template);
        wait.until(ExpectedConditions.invisibilityOfElementLocated(By.id("assign-routine-title")));
        return true;
    }

    public boolean hasCompletedTabContent() {
        SeleniumHelpers.clickButtonContaining(driver, wait, "Rutinas completadas");
        return SeleniumHelpers.pageContainsText(driver, "Rutina");
    }
}
