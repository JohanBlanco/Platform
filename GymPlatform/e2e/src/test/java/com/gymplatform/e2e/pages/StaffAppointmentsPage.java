package com.gymplatform.e2e.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class StaffAppointmentsPage {

    private final WebDriver driver;
    private final WebDriverWait wait;

    public StaffAppointmentsPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    public void open(String webBase) {
        driver.get(webBase + "/agenda/citas");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".appointments-calendar-layout")));
    }

    public boolean calendarLoaded() {
        return !driver.findElements(By.cssSelector(".appointments-calendar-layout")).isEmpty();
    }

    public boolean hasAppointmentBlocks() {
        return !driver.findElements(By.cssSelector("[data-appointment-id], .appointment-reserved-overlay")).isEmpty();
    }
}
