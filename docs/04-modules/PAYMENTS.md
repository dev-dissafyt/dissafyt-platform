# DISSafyt Payments Module

## Purpose

Provide a consistent payment record and verification layer for platform transactions.

## Initial provider direction

PayFast.

The final integration should follow the provider's current API and webhook requirements.

## Payment model

A payment should be associated with a business transaction such as:

- order
- booking
- subscription

## Flow

```text
Customer
   |
Checkout/Booking
   |
Payment provider
   |
Provider response/webhook
   |
DISSafyt API
   |
Verify
   |
Update payment state
   |
Update related business record
```

## Payment states

Conceptual:

```text
initiated
pending
paid
failed
cancelled
refunded
```

## Security

Never trust:

- client-side "payment successful" flags
- manipulated prices from the browser
- arbitrary transaction IDs

The backend must calculate/verify authoritative amounts and validate provider callbacks.

## Reconciliation

Payment records should be sufficient to investigate:

- successful payments
- failed payments
- duplicate callbacks
- refunds
- orders without confirmed payment
