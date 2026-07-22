package com.gymplatform.e2e.support;

import java.net.HttpURLConnection;
import java.net.URI;
import java.time.Duration;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestInfo;
import com.gymplatform.e2e.pages.AppShellPage;
import com.gymplatform.e2e.pages.LoginPage;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.WebDriverWait;
import io.github.bonigarcia.wdm.WebDriverManager;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/** Base Selenium: requiere web en {@code GYMPLATFORM_WEB_URL} (default http://localhost:5173). */
public abstract class BaseSeleniumTest {

    protected static final String WEB_BASE = resolveWebBase();
    private static final String[] REACHABILITY_CANDIDATES = reachabilityCandidates(WEB_BASE);
    protected static final Duration DEFAULT_TIMEOUT = Duration.ofSeconds(30);

    protected WebDriver driver;
    protected WebDriverWait wait;
    private String resolvedWebBase;

    @BeforeEach
    void requireWebServerAndDriver(TestInfo testInfo) {
        resolvedWebBase = firstReachableBase();
        assumeTrue(resolvedWebBase != null,
                "Inicia backend (:8080) y web (:5173) antes de E2E. Ver e2e/README.md");

        WebDriverManager.chromedriver().setup();
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new", "--window-size=1440,900", "--disable-gpu", "--no-sandbox");
        driver = new ChromeDriver(options);
        wait = new WebDriverWait(driver, DEFAULT_TIMEOUT);
        System.out.println("E2E ▶ " + testInfo.getDisplayName() + " @ " + resolvedWebBase);
    }

    @AfterEach
    void tearDownDriver() {
        if (driver != null) {
            driver.quit();
        }
    }

    protected void assertNotOnLoginPage() {
        assertTrue(!driver.getCurrentUrl().contains("/login"),
                "Se esperaba salir de /login; URL actual: " + driver.getCurrentUrl());
    }

    protected String webBase() {
        return resolvedWebBase != null ? resolvedWebBase : WEB_BASE;
    }

    protected AppShellPage shell() {
        return new AppShellPage(driver, wait, webBase());
    }

    protected void loginAs(String email, String password) {
        new LoginPage(driver, wait).login(webBase(), email, password);
        shell().waitForAuthenticatedShell();
    }

    private static String resolveWebBase() {
        String env = System.getenv("GYMPLATFORM_WEB_URL");
        if (env != null && !env.isBlank()) {
            return env.replaceAll("/$", "");
        }
        String prop = System.getProperty("gymplatform.web.url");
        if (prop != null && !prop.isBlank()) {
            return prop.replaceAll("/$", "");
        }
        return "http://localhost:5173";
    }

    private static String[] reachabilityCandidates(String base) {
        if (base.contains("localhost")) {
            return new String[] {base, base.replace("localhost", "[::1]"), base.replace("localhost", "127.0.0.1")};
        }
        return new String[] {base};
    }

    private static String firstReachableBase() {
        for (String candidate : REACHABILITY_CANDIDATES) {
            if (isReachable(candidate)) {
                return candidate;
            }
        }
        return null;
    }

    private static boolean isReachable(String baseUrl) {
        try {
            HttpURLConnection connection = (HttpURLConnection) URI.create(baseUrl).toURL().openConnection();
            connection.setConnectTimeout(3000);
            connection.setReadTimeout(3000);
            connection.setInstanceFollowRedirects(true);
            connection.setRequestMethod("GET");
            int code = connection.getResponseCode();
            connection.disconnect();
            return code >= 200 && code < 500;
        } catch (Exception ex) {
            return false;
        }
    }
}
