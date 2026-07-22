package com.gymplatform.e2e.pages;

import com.gymplatform.e2e.support.SeleniumHelpers;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class PosPage {

    private final WebDriver driver;
    private final WebDriverWait wait;

    public PosPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    public void open(String webBase) {
        driver.get(webBase + "/ventas/punto-de-venta");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".pos-catalog, .pos-toolbar")));
    }

    public boolean isCashOpen() {
        return driver.findElement(By.cssSelector(".pos-cash-pill")).getText().contains("Caja abierta");
    }

    public void dismissBlockingOverlays() {
        var summaryClose = driver.findElements(
                By.cssSelector(".pos-sale-summary button[aria-label='Cerrar resumen']"));
        if (!summaryClose.isEmpty() && summaryClose.get(0).isDisplayed()) {
            SeleniumHelpers.jsClick(driver, summaryClose.get(0));
        }
        if (!driver.findElements(By.cssSelector(".confirm-dialog")).isEmpty()) {
            new ConfirmDialogPage(driver, wait).cancel();
        }
    }

    public void clickCloseCashRegister() {
        dismissBlockingOverlays();
        WebElement btn = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//button[normalize-space()='Cerrar caja' and not(@disabled)]")));
        SeleniumHelpers.jsClick(driver, btn);
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".cash-session-modal")));
    }

    public void clickOpenCashRegister() {
        WebElement btn = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//button[normalize-space()='Abrir caja' and not(@disabled)]")));
        SeleniumHelpers.jsClick(driver, btn);
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".cash-session-modal")));
    }

    public void ensureCashOpen(CashSessionPage cash) {
        if (!isCashOpen()) {
            clickOpenCashRegister();
            cash.openWithDefaultFloat();
        }
        driver.navigate().refresh();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".pos-catalog, .pos-toolbar")));
        if (!isCashOpen()) {
            clickOpenCashRegister();
            cash.openWithDefaultFloat();
        }
        wait.until(ExpectedConditions.textToBePresentInElementLocated(
                By.cssSelector(".pos-cash-pill"), "Caja abierta"));
        wait.until(driver -> !driver.findElements(By.cssSelector("button.pos-product-main:not([disabled])")).isEmpty());
    }

    public void ensureProductsCatalogTab() {
        WebElement tab = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//div[contains(@class,'pos-catalog-head')]//button[contains(@class,'product-manage-tab') and contains(.,'Productos')]")));
        if (!tab.getAttribute("class").contains("active")) {
            SeleniumHelpers.jsClick(driver, tab);
        }
    }

    public void addFirstProductToCart() {
        ensureProductsCatalogTab();
        for (WebElement card : driver.findElements(By.cssSelector(".pos-product-card:not(.is-sold-out)"))) {
            var buttons = card.findElements(By.cssSelector("button.pos-product-main:not([disabled])"));
            if (buttons.isEmpty()) {
                continue;
            }
            SeleniumHelpers.jsClick(driver, buttons.get(0));
            if (!driver.findElements(By.cssSelector(".confirm-dialog")).isEmpty()) {
                new ConfirmDialogPage(driver, wait).confirm("Sí, vender contenedor");
            }
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".pos-cart-line")));
            return;
        }
        throw new IllegalStateException("No hay productos vendibles con caja abierta");
    }

    public void checkoutAllCash() {
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".pos-cart-line")));
        WebElement cobrar = wait.until(ExpectedConditions.elementToBeClickable(
                By.cssSelector("aside.pos-cart button.pos-checkout-btn:not([disabled])")));
        SeleniumHelpers.jsClick(driver, cobrar);
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".pos-payment-modal")));
        WebElement allCash = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//div[contains(@class,'pos-payment-modal')]//button[normalize-space()='Todo efectivo']")));
        SeleniumHelpers.jsClick(driver, allCash);
        WebElement confirm = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//div[contains(@class,'pos-payment-modal')]//button[normalize-space()='Confirmar cobro' and not(@disabled)]")));
        SeleniumHelpers.jsClick(driver, confirm);
        wait.until(ExpectedConditions.invisibilityOfElementLocated(By.cssSelector(".pos-payment-modal")));
    }
}
