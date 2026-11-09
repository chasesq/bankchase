package com.example.paypal;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@SpringBootApplication
@RestController
public class PayPalApplication {
  private static final String PRICE = "10.00";
  private static final String BASE_URL = "live".equalsIgnoreCase(System.getenv("PAYPAL_ENV"))
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";

  private final HttpClient http = HttpClient.newHttpClient();
  private final ObjectMapper json = new ObjectMapper();
  private final String clientId = requiredEnv("PAYPAL_CLIENT_ID");
  private final String clientSecret = requiredEnv("PAYPAL_CLIENT_SECRET");

  public static void main(String[] args) {
    SpringApplication.run(PayPalApplication.class, args);
  }

  private static String requiredEnv(String name) {
    String value = System.getenv(name);
    if (value == null || value.isBlank()) {
      throw new IllegalStateException(name + " must be set");
    }
    return value;
  }

  private JsonNode paypal(String method, String path, String body) throws Exception {
    String credentials = Base64.getEncoder().encodeToString(
        (clientId + ":" + clientSecret).getBytes(StandardCharsets.UTF_8));
    HttpRequest tokenRequest = HttpRequest.newBuilder()
        .uri(URI.create(BASE_URL + "/v1/oauth2/token"))
        .header("Authorization", "Basic " + credentials)
        .header("Content-Type", "application/x-www-form-urlencoded")
        .POST(HttpRequest.BodyPublishers.ofString("grant_type=client_credentials"))
        .build();
    HttpResponse<String> tokenResponse = http.send(tokenRequest, HttpResponse.BodyHandlers.ofString());
    if (tokenResponse.statusCode() < 200 || tokenResponse.statusCode() >= 300) {
      throw new IllegalStateException("PayPal authentication failed");
    }
    String token = json.readTree(tokenResponse.body()).path("access_token").asText();
    if (token.isBlank()) throw new IllegalStateException("PayPal returned no access token");

    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(BASE_URL + path))
        .header("Authorization", "Bearer " + token)
        .header("Content-Type", "application/json")
        .method(method, HttpRequest.BodyPublishers.ofString(body))
        .build();
    HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() < 200 || response.statusCode() >= 300) {
      throw new IllegalStateException("PayPal API returned HTTP " + response.statusCode());
    }
    return json.readTree(response.body());
  }

  @PostMapping("/api/orders")
  public ResponseEntity<?> createOrder() {
    try {
      JsonNode order = paypal("POST", "/v2/checkout/orders", json.writeValueAsString(Map.of(
          "intent", "CAPTURE",
          "purchase_units", new Object[]{Map.of(
              "amount", Map.of("currency_code", "USD", "value", PRICE))})));
      return ResponseEntity.ok(Map.of("id", order.path("id").asText()));
    } catch (Exception error) {
      return ResponseEntity.status(502).body(Map.of("error", "Could not create the order."));
    }
  }

  @PostMapping("/api/orders/{orderId}/capture")
  public ResponseEntity<?> captureOrder(@PathVariable String orderId) {
    if (!orderId.matches("[A-Za-z0-9_-]+")) {
      return ResponseEntity.badRequest().body(Map.of("error", "Invalid order ID."));
    }
    try {
      JsonNode result = paypal("POST", "/v2/checkout/orders/" + orderId + "/capture", "{}");
      return ResponseEntity.ok(Map.of(
          "id", result.path("id").asText(),
          "status", result.path("status").asText()));
    } catch (Exception error) {
      return ResponseEntity.status(502).body(Map.of("error", "Could not capture the order."));
    }
  }
}
