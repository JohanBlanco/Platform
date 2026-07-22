package com.gymplatform.e2e.pages;

import com.gymplatform.e2e.support.SeleniumHelpers;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class MemberRoutinesPage {

    private final WebDriver driver;
    private final WebDriverWait wait;

    public MemberRoutinesPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    public void open(String webBase) {
        driver.get(webBase + "/servicios/rutinas");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.tagName("body")));
    }

    public void requestRoutine(String need, String goals) {
        if (driver.getPageSource().contains("Solo puedes tener una solicitud abierta")) {
            return;
        }
        var buttons = driver.findElements(By.xpath("//button[contains(.,'Solicitar rutina')]"));
        WebElement target = null;
        for (WebElement button : buttons) {
            if (button.isDisplayed() && button.isEnabled()) {
                target = button;
                break;
            }
        }
        if (target == null) {
            throw new IllegalStateException("No se encontró botón Solicitar rutina");
        }
        target.click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("routine-request-title")));
        SeleniumHelpers.fillTextareaAfterLabel(driver, wait, "¿Qué necesitas?", need);
        SeleniumHelpers.fillTextareaAfterLabel(driver, wait, "Objetivos", goals);
        SeleniumHelpers.clickButtonContaining(driver, wait, "Enviar solicitud");
        wait.until(ExpectedConditions.invisibilityOfElementLocated(
                By.cssSelector("[aria-labelledby='routine-request-title']")));
    }

    public boolean pageShowsPendingRequest() {
        String body = driver.findElement(By.tagName("body")).getText();
        return body.contains("Pendiente") || body.contains("En progreso") || body.contains("Solicitud");
    }
}
