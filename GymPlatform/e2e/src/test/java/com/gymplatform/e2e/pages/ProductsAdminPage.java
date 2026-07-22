package com.gymplatform.e2e.pages;

import com.gymplatform.e2e.support.SeleniumHelpers;
import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class ProductsAdminPage {

    private final WebDriver driver;
    private final WebDriverWait wait;

    public ProductsAdminPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    public void open(String webBase) {
        driver.get(webBase + "/reception/productos");
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".products-section")));
        wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector(".product-card")));
    }

    public void clickNewProduct() {
        WebElement createBtn = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//div[contains(@class,'products-toolbar')]//button[contains(.,'Nuevo producto')]")));
        SeleniumHelpers.scrollIntoView(driver, createBtn);
        SeleniumHelpers.jsClick(driver, createBtn);
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(".admin-form-modal")));
    }

    public void fillProfile(String name, String description) {
        SeleniumHelpers.fillInputAfterLabel(driver, wait, "Nombre", name);
        selectFirstCategory();
        SeleniumHelpers.fillTextareaAfterLabel(driver, wait, "Descripción (opcional)", description);
    }

    public void selectFirstCategory() {
        WebElement input = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector(".admin-form-modal .tag-multi-select-field")));
        SeleniumHelpers.jsClick(driver, input);
        input.sendKeys("Otros");
        wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector(".admin-form-modal .tag-multi-suggestion")));
        input.sendKeys(Keys.ENTER);
        wait.until(ExpectedConditions.presenceOfElementLocated(
                By.cssSelector(".admin-form-modal .tag-multi-chip")));
    }

    public void submitRegisterProduct() {
        WebElement submit = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//div[contains(@class,'admin-form-modal')]//button[@type='submit'"
                        + " and normalize-space()='Registrar producto' and not(@disabled)]")));
        SeleniumHelpers.jsClick(driver, submit);
        wait.until(ExpectedConditions.invisibilityOfElementLocated(By.cssSelector(".admin-form-modal")));
    }

    public void openProductByName(String name) {
        WebElement card = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//div[contains(@class,'product-card')][contains(.,'" + name + "')]")));
        SeleniumHelpers.jsClick(driver, card);
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("admin-form-modal-title")));
        ensureProfileTab();
    }

    public void ensureProfileTab() {
        WebElement perfilTab = wait.until(ExpectedConditions.elementToBeClickable(
                By.xpath("//div[contains(@class,'admin-form-modal')]//button[contains(@class,'product-manage-tab') and contains(.,'Perfil')]")));
        if (!perfilTab.getAttribute("class").contains("active")) {
            SeleniumHelpers.jsClick(driver, perfilTab);
        }
        wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//div[contains(@class,'admin-form-modal')]//label[normalize-space()='Nombre']/following::input[1]")));
    }

    public void updateProductName(String updatedName) {
        WebElement nameInput = wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//div[contains(@class,'admin-form-modal')]//label[normalize-space()='Nombre']/following::input[1]")));
        SeleniumHelpers.setReactInputValue(driver, nameInput, updatedName);
    }

    public void saveProfile() {
        SeleniumHelpers.clickButton(driver, wait, "Guardar perfil");
        wait.until(ExpectedConditions.invisibilityOfElementLocated(By.cssSelector(".admin-form-modal")));
    }

    public void deleteCurrentProduct() {
        SeleniumHelpers.clickButton(driver, wait, "Eliminar producto");
        new ConfirmDialogPage(driver, wait).confirmDelete();
        wait.until(ExpectedConditions.invisibilityOfElementLocated(By.cssSelector(".admin-form-modal")));
    }

    public void waitUntilProductRemoved(String name) {
        wait.until(ExpectedConditions.invisibilityOfElementLocated(
                By.xpath("//div[contains(@class,'product-card')][contains(.,'" + name + "')]")));
    }

    public void waitUntilProductListed(String name) {
        wait.until(ExpectedConditions.textToBePresentInElementLocated(
                By.cssSelector(".products-section"), name));
    }

    public boolean listContainsProduct(String name) {
        return SeleniumHelpers.pageContainsText(driver, name)
                && !driver.findElements(By.xpath("//div[contains(@class,'product-card')][contains(.,'" + name + "')]")).isEmpty();
    }
}
