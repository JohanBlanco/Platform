package com.gymplatform.e2e.pages;

import com.gymplatform.e2e.support.SeleniumHelpers;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class CashSessionPage {

    private final WebDriver driver;
    private final WebDriverWait wait;

    public CashSessionPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    public void waitForModal(String title) {
        wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//div[contains(@class,'cash-session-modal')]//h2[normalize-space()='" + title + "']")));
    }

    public void setCountsForTotal(int totalColones) {
        int[] values = {10000, 5000, 1000, 500, 100, 50, 25};
        int remaining = totalColones;
        for (int value : values) {
            int qty = remaining / value;
            setDenominationQuantity(value, qty);
            remaining -= qty * value;
        }
    }

    public void setDenominationQuantity(int valueColones, int quantity) {
        for (WebElement row : driver.findElements(By.cssSelector(".cash-count-row"))) {
            String label = row.findElement(By.tagName("span")).getText();
            if (SeleniumHelpers.parseColones(label) == valueColones) {
                WebElement input = row.findElement(By.cssSelector("input[type='number']"));
                SeleniumHelpers.setReactInputValue(driver, input, Integer.toString(quantity));
                return;
            }
        }
        throw new IllegalStateException("Denominación no encontrada: " + valueColones);
    }

    public int readExpectedCloseTotal() {
        WebElement expected = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//div[contains(@class,'cash-session-summary')]//span[normalize-space()='Esperado en caja']/following-sibling::strong[1]")));
        return SeleniumHelpers.parseColones(expected.getText());
    }

    public void submitOpen() {
        WebElement submit = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//div[contains(@class,'cash-session-modal')]//button[normalize-space()='Abrir caja' and not(@disabled)]")));
        SeleniumHelpers.jsClick(driver, submit);
        wait.until(ExpectedConditions.invisibilityOfElementLocated(By.cssSelector(".cash-session-modal")));
    }

    public void submitClose() {
        WebElement submit = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//div[contains(@class,'cash-session-modal')]//button[normalize-space()='Cerrar caja' and not(@disabled)]")));
        SeleniumHelpers.jsClick(driver, submit);
        wait.until(ExpectedConditions.invisibilityOfElementLocated(By.cssSelector(".cash-session-modal")));
    }

    public int readExpectedOpeningFloat() {
        WebElement expected = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//div[contains(@class,'cash-session-modal')]//span[normalize-space()='Fondo esperado']/following-sibling::strong[1]")));
        return SeleniumHelpers.parseColones(expected.getText());
    }

    public void openWithDefaultFloat() {
        waitForModal("Abrir caja");
        setCountsForTotal(readExpectedOpeningFloat());
        wait.until(ExpectedConditions.presenceOfElementLocated(
                By.cssSelector(".cash-session-modal .cash-balance--ok")));
        submitOpen();
    }

    public void closeMatchingExpected() {
        waitForModal("Cerrar caja");
        setCountsForTotal(readExpectedCloseTotal());
        wait.until(ExpectedConditions.presenceOfElementLocated(
                By.cssSelector(".cash-session-modal .cash-balance--ok")));
        submitClose();
    }
}
