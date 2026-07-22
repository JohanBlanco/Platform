package com.gymplatform.e2e.support;

import java.time.Duration;
import java.util.List;
import org.openqa.selenium.Alert;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public final class SeleniumHelpers {

    private SeleniumHelpers() {}

    public static WebElement waitClickable(WebDriver driver, WebDriverWait wait, By locator) {
        return wait.until(ExpectedConditions.elementToBeClickable(locator));
    }

    public static void clickButton(WebDriver driver, WebDriverWait wait, String exactText) {
        By locator = By.xpath("//button[normalize-space()='" + exactText + "']");
        waitClickable(driver, wait, locator).click();
    }

    public static void clickButtonContaining(WebDriver driver, WebDriverWait wait, String partialText) {
        By locator = By.xpath("//button[contains(normalize-space(), '" + partialText + "')]");
        waitClickable(driver, wait, locator).click();
    }

    public static void fillInputAfterLabel(WebDriver driver, WebDriverWait wait, String labelText, String value) {
        By locator = By.xpath("//label[normalize-space()='" + labelText + "']/following::input[not(@disabled)][1]");
        WebElement input = wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
        input.click();
        input.sendKeys(org.openqa.selenium.Keys.chord(org.openqa.selenium.Keys.CONTROL, "a"));
        input.sendKeys(value);
    }

    public static void fillTextareaAfterLabel(WebDriver driver, WebDriverWait wait, String labelText, String value) {
        By locator = By.xpath("//label[contains(normalize-space(), '" + labelText + "')]/following::textarea[1]");
        WebElement textarea = wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
        textarea.clear();
        textarea.sendKeys(value);
    }

    public static void acceptBrowserConfirmIfPresent(WebDriver driver, Duration timeout) {
        try {
            WebDriverWait shortWait = new WebDriverWait(driver, timeout);
            Alert alert = shortWait.until(ExpectedConditions.alertIsPresent());
            alert.accept();
        } catch (Exception ignored) {
            // no native confirm
        }
    }

    public static void confirmInAppDialog(WebDriver driver, WebDriverWait wait, String confirmButtonText) {
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".confirm-dialog")));
        clickButton(driver, wait, confirmButtonText);
        wait.until(ExpectedConditions.invisibilityOfElementLocated(By.cssSelector(".confirm-dialog")));
    }

    public static boolean pageContainsText(WebDriver driver, String text) {
        return driver.getPageSource().contains(text)
                || driver.findElement(By.tagName("body")).getText().contains(text);
    }

    public static int parseColones(String text) {
        String digits = text.replaceAll("[^0-9]", "");
        if (digits.isEmpty()) {
            return 0;
        }
        return Integer.parseInt(digits);
    }

    public static void scrollIntoView(WebDriver driver, WebElement element) {
        ((JavascriptExecutor) driver).executeScript("arguments[0].scrollIntoView({block:'center'});", element);
    }

    public static void jsClick(WebDriver driver, WebElement element) {
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", element);
    }

    public static void setReactInputValue(WebDriver driver, WebElement input, String value) {
        ((JavascriptExecutor) driver).executeScript(
                """
                const el = arguments[0];
                const value = arguments[1];
                const proto = el instanceof HTMLTextAreaElement
                  ? HTMLTextAreaElement.prototype
                  : HTMLInputElement.prototype;
                const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
                if (setter) {
                  setter.call(el, value);
                } else {
                  el.value = value;
                }
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                """,
                input,
                value);
    }

    public static WebElement firstVisible(WebDriver driver, List<WebElement> elements) {
        for (WebElement element : elements) {
            if (element.isDisplayed()) {
                return element;
            }
        }
        return elements.isEmpty() ? null : elements.get(0);
    }
}
