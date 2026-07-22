package com.gymplatform.e2e.pages;

import com.gymplatform.e2e.support.SeleniumHelpers;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class ConfirmDialogPage {

    private final WebDriver driver;
    private final WebDriverWait wait;

    public ConfirmDialogPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    public void waitVisible() {
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".confirm-dialog")));
    }

    public void confirm(String buttonText) {
        waitVisible();
        WebElement btn = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//div[contains(@class,'confirm-dialog')]//button[normalize-space()='" + buttonText + "']")));
        SeleniumHelpers.jsClick(driver, btn);
        wait.until(ExpectedConditions.invisibilityOfElementLocated(By.cssSelector(".confirm-dialog")));
    }

    public void confirmDelete() {
        confirm("Eliminar");
    }

    public void cancel() {
        confirm("Cancelar");
    }
}
