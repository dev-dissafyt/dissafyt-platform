# Dissafyt Studio & Factory Management Application

## 1. Purpose

The Studio application (`apps/studio`) provides dual operational capabilities:
1. **The Factory Production & Kasi Kollekt Fulfillment Desk**: Direct control over the on-demand printing queue, job tickets, garment preparation, quality inspection, and Courier Guy shipping dispatch.
2. **The Creator & Brand Owner Suite**: A streamlined portal for local designers, streetwear brands, and artists to upload graphics, generate interactive apparel mockups, select commercial deal structures (*Stacked Returns* vs *Drip Income*), and track live earnings.

---

## 2. Port & Workspace Identity

- **Monorepo Path**: `apps/studio`
- **Default Port**: `3002` (alongside `apps/customer` on `3000` and `apps/admin` on `3001`)
- **Shared Monorepo Packages**:
  - `@dissafyt/ui`: Design tokens, button components, modal system, responsive layouts.
  - `@dissafyt/database`: Shared PostgreSQL schema (`brands`, `print_jobs`, `products`, `orders`).
  - `@dissafyt/api`: Unified RBAC enforcement, `StudioService`, `BrandService`, `AuditService`.

---

## 3. Dual Personas & Authorization

The application uses Dissafyt's unified identity system with role-based access boundaries:

```text
                     Unified Identity (Supabase Auth)
                                    |
                    +---------------+---------------+
                    |                               |
              Factory / Staff                    Creator / Brand Owner
          (Full Production Control)           (Isolated Brand Management)
                    |                               |
            - Print Queue Kanban             - Design Asset Upload
            - High-Res Download              - 2D Canvas Mockup
            - Job Tickets & Placement        - Deal Selector
            - Kasi Kollekt Dispatch          - Payout / Drip Ledger
            - Courier Guy Waybills           - Brand Profile
```

---

## 4. Core Application Sections

### 1. The Factory Queue (`/jobs` or `/factory`)
- **Incoming Order Mirroring**: Every customer order on `apps/customer` containing custom brand drops automatically generates mirrored `print_jobs` tickets in the factory queue.
- **Production Kanban Stages**:
  `Pending Print` $\rightarrow$ `In Production (Printing / Press)` $\rightarrow$ `Quality Inspection (QC Passed)` $\rightarrow$ `Packed & Dispatched`.
- **Job Ticket Inspector**:
  - Garment base SKU (e.g., Heavyweight 240gsm Boxy Tee in Black, Size L).
  - Print placement coordinates (e.g., *Front Center, 10cm below collar, 28cm width*).
  - High-resolution asset download (300 DPI vector/PNG).
  - Customer shipping destination.

### 2. The Creator Studio (`/studio`)
- **Artwork Vault**: Secure upload of print-ready graphics with transparent backgrounds.
- **2D Mockup Preview**: Real-time rendering of the graphic placed onto blank tees, hoodies, and crewnecks.
- **Commercial Deal Selection**:
  - **Option A: "Stacked Returns" (Wholesale / Consignment)**:
    - Pre-funded batch run (e.g. 50–200 units).
    - Physical stock allocation to studio racks and online store.
    - Higher margin return for brands with investment capital.
  - **Option B: "Drip Income" (Print-on-Demand)**:
    - R0 upfront cost.
    - Just-in-time on-demand fulfillment.
    - Dynamic royalty slider showing:
      $$\text{Retail Price} - \text{Kasi Kollekt Base Print Cost} = \text{Creator Drip Income}$$

### 3. Kasi Kollekt Fulfillment Desk (`/dispatch`)
- Quality inspection checklist.
- Packaging slip generation with Kasi Kollekt branding.
- One-click **The Courier Guy** waybill generation and barcode printing.
- Automated customer dispatch notification (SMS/WhatsApp/Email).
- Automatic creator ledger credit.

---

## 5. Architectural Data Flow

```text
Customer places order on Storefront (apps/customer)
                    |
PayFast ITN verifies payment (200 OK)
                    |
Order created in PostgreSQL (public.orders)
                    |
Automated trigger creates Factory Job Tickets (public.print_jobs)
                    |
Studio App (apps/studio) receives real-time ticket
                    |
Factory operator prints garment using placement specs
                    |
QC Passed -> Waybill printed -> Handed to The Courier Guy
                    |
Order updated to 'dispatched' across all apps
```
