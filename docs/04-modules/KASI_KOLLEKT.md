# Kasi Kollekt: Marketplace & Micro-Factory Production Module

## 1. Executive Overview

**Kasi Kollekt** is the urban marketplace, creator incubation, and on-demand micro-factory fulfillment engine of the Dissafyt platform. 

It solves the primary barrier for local streetwear designers, artists, and creators: **inventory risk, high upfront manufacturing costs, and fragmented logistics**.

By integrating an in-house print shop and centralized fulfillment desk, Kasi Kollekt enables creators to launch retail-ready apparel that is sold simultaneously on the Dissafyt digital storefront and physically showcased on racks within Dissafyt barbershop studios.

---

## 2. Commercial Deal Structures

Kasi Kollekt operates two distinct partnership models tailored to different creator profiles:

```text
                               Creator Partnership Models
                                           |
                   +-----------------------+-----------------------+
                   |                                               |
         Option A: "Stacked Returns"                      Option B: "Drip Income"
        (Wholesale / Consignment Batch)                  (Print-on-Demand Royalty)
                   |                                               |
      - Brand invests upfront capital                 - R0 upfront investment
      - Pre-printed inventory batch                   - Just-in-time on-demand printing
      - Physical rack placement                       - Virtual catalog listing
      - Higher unit margin for brand                  - Steady passive royalty per sale
      - Ideal for established labels                  - Ideal for artists & indie creators
```

### Model Comparison:

| Feature | Option A: Stacked Returns | Option B: Drip Income |
| :--- | :--- | :--- |
| **Capital Requirement** | Upfront batch cost (e.g., 50–200 units) | **R0** |
| **Production Timing** | Bulk pre-print run | Triggered on confirmed customer order |
| **Inventory State** | Physical stock in fulfillment hub & studio racks | Virtual on-demand stock |
| **Gross Margin Split** | Brand earns wholesale margin (e.g. 70–80% of retail) | Platform retains base print fee; creator earns remaining profit |
| **Example Economics** | Blank + Print = R150<br>Retail = R380<br>Brand earns: **R230/unit** on batch | Base Print Fee = R180<br>Retail = R380<br>Creator earns: **R200 drip/unit** |
| **Stock Management** | Monitored with low-stock reorder triggers | Unlimited virtual inventory bounded by blank garment stock |

---

## 3. Core Database Entities

```text
User Profile (Creator)
       |
     Brand (public.brands)
       |
   +---+-------------------------+
   |                             |
Product (public.products)     Royalty Ledger (public.creator_payouts)
   |
Variant (public.product_variants)
   |
Order (public.orders)
   |
Print Job Ticket (public.print_jobs)
   |
Fulfillment Dispatch (The Courier Guy)
```

### Entity Schemas:

1. **`public.brands`**:
   - `id`: UUID primary key
   - `user_id`: UUID linked to creator `profiles.id`
   - `name`: Brand or artist display name (e.g., *"Soweto Thread Co."*)
   - `slug`: Unique URL identifier (e.g., `soweto-thread-co`)
   - `bio`: Creator story and brand statement
   - `logo_url`: Avatar or brand emblem
   - `deal_type`: `'stacked_returns'` | `'drip_income'`
   - `commission_rate`: Agreed platform fulfillment margin percentage
   - `created_at`: Timestamp

2. **`public.products` (Kasi Kollekt Enhancements)**:
   - `brand_id`: UUID references `brands.id`
   - `design_file_url`: High-resolution vector (SVG/PDF) or 300 DPI transparent PNG
   - `mockup_url`: Generated 2D preview image of garment
   - `print_placement`: JSONB containing production specs:
     ```json
     {
       "location": "front_chest",
       "offset_top_cm": 9.5,
       "width_cm": 28.0,
       "alignment": "center"
     }
     ```
   - `is_custom_print`: Boolean flag distinguishing on-demand drops from static stock

3. **`public.print_jobs` (Factory Production Queue)**:
   - `id`: UUID primary key
   - `order_id`: UUID references customer `orders.id`
   - `order_item_id`: Specific line item
   - `product_id` & `variant_id`: Garment and size references
   - `brand_id`: Origin brand
   - `garment_color`: e.g. `'Washed Charcoal'`
   - `garment_size`: `'S'`, `'M'`, `'L'`, `'XL'`, `'2XL'`
   - `print_technique`: `'dtf'` (Direct-to-Film), `'screenprint'`, `'embroidery'`
   - `status`: Lifecycle state machine:
     `pending` $\rightarrow$ `printing` $\rightarrow$ `qc_passed` $\rightarrow$ `packed` $\rightarrow$ `dispatched`
   - `tracking_number`: Courier waybill number
   - `created_at` & `updated_at`

---

## 4. Factory Production & Fulfillment Lifecycle

1. **Checkout & ITN Handshake**:
   - Customer completes checkout on `apps/customer` via PayFast.
   - PayFast ITN webhook verifies payment (`payment_status: COMPLETE`).
   - Order items flagged with `is_custom_print: true` automatically spawn `print_jobs` records.

2. **Factory Job Ticket Generation**:
   - The Studio app (`apps/studio`) receives the real-time job ticket.
   - Operator prints the **Production Slip** featuring:
     - Garment SKU and bin location for blanks.
     - Print file direct download.
     - Measurement positioning guide.
     - Barcode identifying `print_job_id`.

3. **Print Execution & Quality Control (QC)**:
   - Garment is pressed/printed.
   - Inspector scans barcode and verifies print alignment, cure, and fabric finish.
   - Status updated to `qc_passed`.

4. **Kasi Kollekt Packaging & Dispatch**:
   - Item packed with Kasi Kollekt hangtags and packing slip.
   - The Courier Guy API generates tracking waybill.
   - Order marked `dispatched`; customer receives automated tracking link.
   - Creator royalty ledger automatically credited.

---

## 5. Future AI Horizon: Unified Buyer Profile & Outfit Autoprompting

Because customer profiles are unified across grooming and commerce, Kasi Kollekt will introduce:

1. **Fit & Spec Profile**:
   - Buyers specify height, build, and preferred silhouette (*Oversized / Boxy* vs *Regular*).
   - System recommends exact sizing for each Kasi Kollekt garment blank.

2. **Outfit Coordinate Engine**:
   - AI-powered matching: When a customer buys or views a graphic tee, the system suggests matching headwear, bottoms, or cross-promotes a grooming appointment:
     > *"Matches with: Heavy Canvas Cap (Kasi Kollekt) + Book Beard Sculpt with Marcus at Johannesburg Flagship Studio."*
