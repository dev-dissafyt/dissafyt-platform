# DISSafyt Notifications Module

## Purpose

Provide a shared mechanism for communicating important platform events to customers and staff.

## Channels

Potential channels:

- email
- WhatsApp
- SMS
- in-app

## Events

Examples:

```text
user registered
booking created
booking confirmed
booking changed
booking reminder
payment received
order placed
order shipped
subscription changed
```

## Architecture

```text
Business event
     |
Notification decision
     |
Notification provider
     |
Delivery
     |
Delivery status
```

## Principle

Notifications should be triggered by validated platform events rather than frontend guesses.

## Future considerations

- templates
- customer notification preferences
- delivery retries
- opt-out rules
- staff alerts
- notification history
