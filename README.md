# Foodie Express — Food delivery platform
Next.js 14 (App Router) · MongoDB/Mongoose · Razorpay (Route) · Gemini AI · JWT cookie auth

## Panels
| Role | URL | What they do |
|---|---|---|
| Customer | `/` | Location picker (GPS or search), category images, filters, restaurant menus, cart, Razorpay/COD checkout, live map tracking, AI food assistant |
| Restaurant | `/partner` | Dashboard, order board with sound alert, menu with photos (upload or AI-generated), profile, earnings & bank details |
| Rider | `/rider` | Online toggle, GPS streaming, pickup/deliver, navigation links |
| Admin | `/admin` | Overview charts, orders & rider assignment, restaurants, riders, customers, categories, payouts, Gemini insights |

## Quick start
```bash
cp .env.example .env        # fill values (see below)
npm install
npm run seed                # creates admin (+ demo data if SEED_DEMO=true)
npm run dev                 # http://localhost:3000
```
Production: `npm run build && npm start`, or `docker compose up -d --build`.

## Payment flow (Razorpay Route)
1. Customer pays the **platform (admin) Razorpay account** — prices, delivery fee and the service-radius check are computed **server-side**; payment signature is verified server-side + via webhook.
2. After capture, the restaurant's share (`subtotal − commission`) is created as a **Route transfer on hold** to the restaurant's linked account.
3. When the rider marks **Delivered**, the hold is released and Razorpay settles to the restaurant's bank account.
4. If a restaurant has no linked account (or a transfer fails), the order is flagged `manual_due`; pay by bank transfer and click **Mark paid** in Admin → Orders. COD orders always use this path.
5. Cancel/reject of a paid order triggers an automatic refund.

Setup: enable **Route** in your Razorpay dashboard → add webhook `https://YOUR_DOMAIN/api/payments/webhook` (events `payment.captured`, `payment.failed`) with the secret in `RAZORPAY_WEBHOOK_SECRET`. In Admin → Restaurants either paste an existing linked account id (`acc_…`) or use *Create linked acct* (uses the restaurant's KYC/bank details; verify the payload against current Razorpay Route docs and your account's KYC requirements before going live).

## Location logic
- Restaurants use a MongoDB `2dsphere` index; `/api/restaurants` uses `$geoNear`.
- Orders are rejected if the delivery point is beyond the restaurant's delivery radius; delivery fee = base + per-km.
- Rider auto-assignment claims the nearest online idle rider within 8 km atomically; late-online riders get unassigned orders.

## Security notes
- **Rotate any API key that was ever pasted in chat/email**; keep secrets only in `.env` (never committed).
- Set a strong `AUTH_SECRET`; serve over HTTPS (cookie is `secure` in production).
- The in-memory rate limiter is per-instance; use Redis if you scale horizontally.
- Rider tracking uses polling (5–8 s); swap to SSE/WebSockets for higher scale.
- Add automated tests, monitoring and a legal review (GST invoices, T&C, privacy) before launch.

## Demo restaurants
`SEED_DEMO=true npm run seed` adds 14 sample restaurants (with menus and photos) around Kolkata plus demo logins. It is safe to re-run: existing names are skipped. To place them near *you*, change the `lat`/`lng` values in `scripts/seed.js` (or add restaurants through the Restaurant sign-up flow and approve them in Admin → Restaurants).

## Pricing, charges & coupons
- **Admin → Charges & delivery:** free-delivery on/off and threshold (default: free above ₹200), base fee, per-km fee, max distance, rider share %, GST/tax %, platform fee, default commission and any number of **extra charges** (flat ₹ or % of items). Changes apply to new orders immediately.
- **Restaurant → Restaurant & charges:** each restaurant can add its own charges (e.g. packaging). They appear as separate lines at checkout and are paid to the restaurant.
- **Coupons:** Admin → Coupons (platform-funded, all restaurants) and Restaurant → Coupons (restaurant-funded, own menu only). Percent or flat, max discount, min order, total/per-customer limits, first-order-only, validity dates.
- **Payout maths:** restaurant share = items − commission − (restaurant-funded coupon) + restaurant charges. Platform coupons and free delivery are absorbed by the platform.

## Carts
Each restaurant has its own cart (Cart 1, Cart 2, …). Adding from another restaurant never replaces anything; at checkout pick which cart to order — the rest stay saved.

## Browsing
Header with location, live search suggestions, offers, cart and category links. Clicking a category opens `/category/<name>` with the category strip, *highly ordered* dishes, *top rated* dishes and restaurants near you. The home page shows *Recommended for you* dishes that open the restaurant page with the dish highlighted.

## Checkout, rider batching & reviews (latest changes)
- **New address at checkout** – "New address" shows every address field inline (type, area, flat, landmark, pincode, receiver, phone, instructions). Nothing is highlighted while you type. After the order succeeds (COD: immediately, online: after payment is verified) the address is saved, set as your default and linked to the order(s) (`Order.addressId`).
- **Multi-restaurant checkout** – every cart appears on the checkout page with a tick box; one payment (one Razorpay order) covers all ticked carts. Each restaurant has its own coupon box, bill, delivery fee and taxes (`POST /api/orders` accepts `orders: [{restaurantId, items, couponCode}]`). A coupon code can be used on only one restaurant per checkout. Orders from one checkout share `Order.group`; payment verify/webhook mark all of them paid, refunds are per order.
- **Rider batching** – when a restaurant accepts, `autoAssign` first looks for an online rider who already has an order (not yet picked up) to the same drop point (≤150 m) with a pickup restaurant ≤4 km away (max 3 orders per rider); otherwise it claims the nearest idle rider as before. A rider stays "busy" until all his orders are done, and must pick up every order for an address before delivering any.
- **Reviews** – after delivery the order page shows a review box (restaurant stars, per-dish stars, comment). Reviews appear under "Ratings & reviews" on the restaurant page, dish ratings show on menu cards, and `Restaurant.rating/ratingCount` update automatically (`/api/reviews`).
