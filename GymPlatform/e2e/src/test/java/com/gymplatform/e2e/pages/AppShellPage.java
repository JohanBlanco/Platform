package com.gymplatform.e2e.pages;

import com.gymplatform.e2e.support.SeleniumHelpers;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class AppShellPage {

    private final WebDriver driver;
    private final WebDriverWait wait;
    private final String webBase;

    public AppShellPage(WebDriver driver, WebDriverWait wait, String webBase) {
        this.driver = driver;
        this.wait = wait;
        this.webBase = webBase;
    }

    public AppShellPage(WebDriver driver, WebDriverWait wait) {
        this(driver, wait, null);
    }

    public void waitForAuthenticatedShell() {
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("app-sidebar")));
    }

    public boolean sidebarContainsText(String text) {
        return driver.findElement(By.id("app-sidebar")).getText().contains(text);
    }

    public void goTo(String path) {
        String base = webBase != null ? webBase : driver.getCurrentUrl().replaceAll("/[^/]*$", "");
        if (path.startsWith("http")) {
            driver.get(path);
        } else {
            driver.get(base + (path.startsWith("/") ? path : "/" + path));
        }
        waitForAuthenticatedShell();
    }

    public void openUserMenu() {
        wait.until(ExpectedConditions.elementToBeClickable(By.cssSelector(".user-menu-trigger"))).click();
    }

    public void switchToProfile(String roleLabel) {
        openUserMenu();
        wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//button[contains(@class,'user-menu-role-item')][.//span[text()='" + roleLabel + "']]")
        )).click();
        waitForAuthenticatedShell();
    }

    public void logout() {
        openUserMenu();
        wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//button[contains(@class,'user-menu-item') and contains(.,'Cerrar sesión')]")
        )).click();
        wait.until(ExpectedConditions.urlContains("/login"));
    }

    public void expandNavGroupIfNeeded(String groupLabel) {
        var headers = driver.findElements(By.xpath(
                "//nav[@id='app-sidebar']//button[contains(@class,'sidebar-group-header')][contains(.,'" + groupLabel + "')]"));
        if (headers.isEmpty()) {
            return;
        }
        WebElement header = headers.get(0);
        String expanded = header.getAttribute("aria-expanded");
        if (!"true".equals(expanded)) {
            header.click();
        }
    }

    public void clickSidebarHref(String href) {
        By link = By.cssSelector("#app-sidebar a[href='" + href + "']");
        if (driver.findElements(link).isEmpty()) {
            goTo(href);
            return;
        }
        SeleniumHelpers.scrollIntoView(driver, driver.findElement(link));
        wait.until(ExpectedConditions.elementToBeClickable(link)).click();
        waitForAuthenticatedShell();
    }
}
