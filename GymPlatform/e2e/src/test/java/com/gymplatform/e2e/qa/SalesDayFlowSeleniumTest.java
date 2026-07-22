package com.gymplatform.e2e.qa;

import com.gymplatform.e2e.pages.CashSessionPage;
import com.gymplatform.e2e.pages.PosPage;
import com.gymplatform.e2e.pages.SalesHistoryPage;
import com.gymplatform.e2e.support.BaseSeleniumTest;
import com.gymplatform.e2e.support.TestCredentials;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

/** TC-SALES-* — jornada de ventas: caja, ventas, ingresos/gastos, cierre y segundo turno. */
class SalesDayFlowSeleniumTest extends BaseSeleniumTest {

    @Test
    @DisplayName("TC-SALES-DAY: abrir caja, vender, ingresos/gastos, cerrar, segundo turno")
    void fullSalesDayWorkflow() {
        loginAs(TestCredentials.RECEPTION_EMAIL, TestCredentials.RECEPTION_PASSWORD);

        PosPage pos = new PosPage(driver, wait);
        CashSessionPage cash = new CashSessionPage(driver, wait);
        SalesHistoryPage history = new SalesHistoryPage(driver, wait);

        pos.open(webBase());
        pos.ensureCashOpen(cash);
        assertTrue(pos.isCashOpen(), "La caja debe quedar abierta");

        pos.addFirstProductToCart();
        pos.checkoutAllCash();

        history.open(webBase());
        history.addManualIncome(5000, "E2E ingreso manual");
        history.addManualExpense(2000, "E2E gasto manual");
        assertTrue(history.summaryShowsMovementTypes(), "El historial debe mostrar ventas, ingresos y gastos");
        assertTrue(history.pageContainsText("E2E ingreso manual"));
        assertTrue(history.pageContainsText("E2E gasto manual"));

        pos.open(webBase());
        pos.clickCloseCashRegister();
        cash.closeMatchingExpected();
        assertTrue(!pos.isCashOpen(), "La caja del primer turno debe cerrarse");

        pos.open(webBase());
        if (!pos.isCashOpen()) {
            pos.clickOpenCashRegister();
            cash.openWithDefaultFloat();
        }
        assertTrue(pos.isCashOpen(), "La segunda caja debe abrirse");

        pos.addFirstProductToCart();
        pos.checkoutAllCash();

        pos.clickCloseCashRegister();
        cash.closeMatchingExpected();
        assertTrue(!pos.isCashOpen(), "La segunda caja debe cerrarse");
    }
}
