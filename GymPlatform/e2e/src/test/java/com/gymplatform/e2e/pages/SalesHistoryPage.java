package com.gymplatform.e2e.pages;

import com.gymplatform.e2e.support.SeleniumHelpers;
import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class SalesHistoryPage {

    private static final By MANUAL_DIALOG = By.cssSelector(".availability-modal[role='dialog']");

    private final WebDriver driver;
    private final WebDriverWait wait;

    public SalesHistoryPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    public void open(String webBase) {
        driver.get(webBase + "/ventas/historial");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".store-history")));
    }

    public void addManualIncome(int amount, String description) {
        openManualEntryModal("+ Ingreso", "Registrar ingreso");
        fillManualEntry(amount, description);
        saveManualEntry("Registrar ingreso");
    }

    public void addManualExpense(int amount, String description) {
        openManualEntryModal("+ Gasto", "Registrar gasto");
        fillManualEntry(amount, description);
        saveManualEntry("Registrar gasto");
    }

    private void openManualEntryModal(String buttonLabel, String dialogTitle) {
        WebElement btn = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//div[contains(@class,'store-history-actions')]//button[contains(.,'" + buttonLabel + "')]")));
        SeleniumHelpers.jsClick(driver, btn);
        wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//div[contains(@class,'availability-modal') and @role='dialog']//h2[contains(.,'" + dialogTitle + "')]")));
    }

    private void fillManualEntry(int amount, String description) {
        WebElement amountInput = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//div[contains(@class,'availability-modal') and @role='dialog']//label[contains(.,'Monto')]/input")));
        SeleniumHelpers.setReactInputValue(driver, amountInput, Integer.toString(amount));
        wait.until(ExpectedConditions.attributeToBeNotEmpty(amountInput, "value"));

        WebElement notesInput = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//div[contains(@class,'availability-modal') and @role='dialog']//label[contains(.,'Descripción')]/input")));
        SeleniumHelpers.setReactInputValue(driver, notesInput, description);
        wait.until(ExpectedConditions.textToBePresentInElementValue(notesInput, description));
    }

    private void saveManualEntry(String dialogTitle) {
        WebElement save = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//div[contains(@class,'availability-modal') and @role='dialog']"
                        + "//button[normalize-space()='Guardar' and not(@disabled)]")));
        SeleniumHelpers.jsClick(driver, save);
        wait.until(ExpectedConditions.invisibilityOfElementLocated(
                By.xpath("//div[contains(@class,'availability-modal') and @role='dialog']"
                        + "//h2[contains(.,'" + dialogTitle + "')]")));
    }

    public boolean summaryShowsMovementTypes() {
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".store-history-summary")));
        String body = driver.findElement(By.cssSelector(".store-history")).getText();
        return body.contains("Ventas") && body.contains("Ingresos") && body.contains("Gastos");
    }

    public boolean pageContainsText(String text) {
        return SeleniumHelpers.pageContainsText(driver, text);
    }
}
