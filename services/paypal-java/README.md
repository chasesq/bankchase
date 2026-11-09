# PayPal Java service

Minimal Spring Boot 3 service for creating and capturing PayPal orders with Java 17+.

## Environment

Set these variables before starting the service:

- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_ENV` — use `live` for production; any other value uses PayPal Sandbox
- `PORT` — optional, defaults to `8081`

## Run

```bash
mvn spring-boot:run
```

The service exposes `POST /api/orders` and `POST /api/orders/{orderId}/capture`. The price is intentionally fixed server-side at USD 10.00 for this proof of concept; replace it with a server-side catalog lookup before accepting user-supplied products.
