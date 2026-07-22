package com.gymplatform.e2e.qa;

import com.gymplatform.e2e.pages.ProductsAdminPage;
import com.gymplatform.e2e.support.BaseSeleniumTest;
import com.gymplatform.e2e.support.TestCredentials;
import com.gymplatform.e2e.support.TestData;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** TC-PRODUCTS-* — crear, editar y eliminar productos. */
class ProductsCrudSeleniumTest extends BaseSeleniumTest {

    @Test
    @DisplayName("TC-PRODUCTS-CRUD: crear, modificar y eliminar producto")
    void createEditDeleteProduct() {
        loginAs(TestCredentials.ADMIN_EMAIL, TestCredentials.ADMIN_PASSWORD);

        String name = "Producto E2E " + TestData.suffix();
        String updatedName = name + " Edit";

        ProductsAdminPage products = new ProductsAdminPage(driver, wait);
        products.open(webBase());
        products.clickNewProduct();
        products.fillProfile(name, "Descripción inicial E2E");
        products.submitRegisterProduct();
        products.waitUntilProductListed(name);
        assertTrue(products.listContainsProduct(name));

        products.openProductByName(name);
        products.updateProductName(updatedName);
        products.saveProfile();
        assertTrue(products.listContainsProduct(updatedName));

        products.openProductByName(updatedName);
        products.deleteCurrentProduct();
        products.waitUntilProductRemoved(updatedName);
        assertFalse(products.listContainsProduct(updatedName));
    }
}
