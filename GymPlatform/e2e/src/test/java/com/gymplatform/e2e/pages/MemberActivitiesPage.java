package com.gymplatform.e2e.pages;

import com.gymplatform.e2e.support.SeleniumHelpers;
import java.time.Duration;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class MemberActivitiesPage {

    private final WebDriver driver;
    private final WebDriverWait wait;

    public MemberActivitiesPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    public void open(String webBase) {
        driver.get(webBase + "/servicios/actividades");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".member-activities-agenda")));
    }

    public boolean reserveFirstAvailableActivity() {
        var cards = driver.findElements(By.cssSelector(".member-activity-agenda-card:not(.is-reserved)"));
        for (WebElement card : cards) {
            if (!card.isDisplayed() || card.getText().contains("Sin cupos")) {
                continue;
            }
            WebElement reserveBtn = card.findElement(By.xpath(".//button[contains(.,'Reservar')]"));
            if (!reserveBtn.isEnabled()) {
                continue;
            }
            reserveBtn.click();
            SeleniumHelpers.acceptBrowserConfirmIfPresent(driver, Duration.ofSeconds(3));
            wait.until(ExpectedConditions.or(
                    ExpectedConditions.textToBePresentInElementLocated(By.tagName("body"), "Asistencia reservada"),
                    ExpectedConditions.textToBePresentInElementLocated(By.cssSelector(".member-activity-agenda-card"), "Reservada")));
            return true;
        }
        return false;
    }

    public boolean hasReservedBadge() {
        return !driver.findElements(By.cssSelector(".member-activity-agenda-card.is-reserved, .badge-confirmed")).isEmpty();
    }
}
