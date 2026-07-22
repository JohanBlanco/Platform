package com.gymplatform;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;

import java.nio.file.Files;
import java.nio.file.Path;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@EnabledIfSystemProperty(named = "exportOpenApi", matches = "true")
class OpenApiExportTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void exportOpenApiSpec() throws Exception {
        String url = "http://localhost:" + port + "/v3/api-docs";
        String json = restTemplate.getForObject(url, String.class);

        Path output = Path.of(System.getProperty("user.dir"))
                .getParent()
                .resolve("docs")
                .resolve("openapi.json");

        Files.createDirectories(output.getParent());
        Files.writeString(output, json);

        System.out.println("OpenAPI exportado en: " + output.toAbsolutePath());
    }
}
