# DISSafyt Clothing / Commerce Module

## 1. Purpose

The clothing module provides DISSafyt e-commerce functionality while using the shared customer identity.

## 2. Core entities

```text
Customer
   |
Cart
   |
Order
   |
Order Items
   |
Product
   |
Variant
```

## 3. Products

Product data may include:

- name
- description
- images
- category
- base price
- active status
- variants

## 4. Variants

Variants may represent:

- size
- colour
- style
- SKU
- stock quantity
- variant-specific price

## 5. Inventory

Inventory should be tracked against the appropriate sellable variant.

Important rules:

- stock cannot become negative
- checkout must validate availability
- concurrent purchases must be handled safely
- stock changes should be traceable

## 6. Customer shopping flow

```text
Browse
  |
Product
  |
Select variant
  |
Add to cart
  |
Review cart
  |
Checkout
  |
Payment
  |
Order confirmation
```

## 7. Cart

The cart should support:

- adding items
- changing quantities
- removing items
- calculating totals
- validating product availability

The backend should recalculate authoritative pricing.

## 8. Orders

An order should record:

- customer
- order number
- order items
- quantity
- price at time of purchase
- total
- payment state
- fulfillment state
- shipping information
- timestamps

Do not depend on current product prices to reconstruct historical orders.

## 9. Order states

Initial concept:

```text
pending_payment
paid
processing
fulfilled
shipped
completed
cancelled
refunded
```

## 10. Customer capabilities

- browse
- search/filter
- view product
- select variant
- cart
- checkout
- payment
- order history
- order status

## 11. Admin capabilities

- create products
- edit products
- manage categories
- manage variants
- manage stock
- change pricing
- manage product media
- manage orders
- update fulfillment status

## 12. Payment principle

The frontend cannot be the authority for successful payment.

Payment confirmation must be verified through the backend/provider mechanism.

## 13. Future functionality

Potential future features:

- discounts
- promotions
- bundles
- wishlists
- reviews
- loyalty
- subscriptions
- limited drops
- stock alerts
