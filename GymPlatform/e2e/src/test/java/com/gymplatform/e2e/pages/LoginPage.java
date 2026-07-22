package com.gymplatform.e2e.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class LoginPage {

    private final WebDriver driver;
    private final WebDriverWait wait;

    public LoginPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    public LoginPage open(String baseUrl) {
        driver.get(baseUrl + "/login");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("login-identifier")));
        return this;
    }

    public LoginPage typeCredentials(String login, String password) {
        WebElement loginInput = driver.findElement(By.id("login-identifier"));
        WebElement passwordInput = driver.findElement(By.id("login-password"));
        loginInput.clear();
        loginInput.sendKeys(login);
        passwordInput.clear();
        passwordInput.sendKeys(password);
        return this;
    }

    public void submit() {
        driver.findElement(By.cssSelector("button.btn-primary[type='submit']")).click();
    }

    public void login(String baseUrl, String login, String password) {
        open(baseUrl);
        typeCredentials(login, password);
        submit();
    }
}
