import mongoose from 'mongoose';
const { Schema, models, model } = mongoose;
const Point = { type: { type: String, enum: ['Point'] }, coordinates: { type: [Number] } };
const oid = (ref) => ({ type: Schema.Types.ObjectId, ref });

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: String,
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['customer', 'restaurant', 'rider', 'admin'], default: 'customer' },
  approved: { type: Boolean, default: true },
  restaurant: oid('Restaurant'),
  favorites: [{ type: Schema.Types.ObjectId, ref: 'Restaurant' }],
  rider: { online: { type: Boolean, default: false }, busy: { type: Boolean, default: false }, vehicle: String, updatedAt: Date, location: Point },
}, { timestamps: true });
UserSchema.index({ 'rider.location': '2dsphere' });

const RestaurantSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: String, image: String, logo: String,
  cuisines: [String],
  owner: oid('User'),
  address: String,
  location: { ...Point, type: { type: String, enum: ['Point'], default: 'Point' } },
  deliveryRadiusKm: { type: Number, default: 8 },
  isOpen: { type: Boolean, default: true },
  approved: { type: Boolean, default: false },
  commissionPct: { type: Number, default: 15 },
  offer: String, pureVeg: { type: Boolean, default: false },
  charges: [{ _id: false, name: String, amount: Number }], // restaurant-set charges (e.g. packaging)
  rating: { type: Number, default: 4.2 }, ratingCount: { type: Number, default: 0 },
  prepMinutes: { type: Number, default: 25 },
  bank: {
    legalName: String, pan: String, gst: String,
    beneficiary: String, accountNumber: String, ifsc: String,
    street: String, city: String, state: String, pincode: String,
  },
  linkedAccountId: String, // Razorpay Route linked account (acc_xxx)
}, { timestamps: true });
RestaurantSchema.index({ location: '2dsphere' });


const AddressSchema = new Schema({
  user: { ...oid('User'), index: true },
  type: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' },
  name: String, phone: String,
  line: String, landmark: String, area: String, pincode: String, instructions: String,
  lat: Number, lng: Number,
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

const MenuItemSchema = new Schema({
  restaurant: { ...oid('Restaurant'), index: true },
  name: { type: String, required: true }, description: String, image: String,
  price: { type: Number, required: true, min: 1 },
  veg: { type: Boolean, default: true }, category: { type: String, default: 'Main' },
  tags: [String], available: { type: Boolean, default: true }, baseOrders: { type: Number, default: 0 },
}, { timestamps: true });

const OrderSchema = new Schema({
  customer: { ...oid('User'), index: true },
  restaurant: { ...oid('Restaurant'), index: true },
  rider: { ...oid('User'), index: true },
  items: [{ item: oid('MenuItem'), name: String, price: Number, qty: Number }],
  address: { line: String, phone: String, location: Point },
  addressId: oid('Address'), pendingAddress: Schema.Types.Mixed, // new address typed at checkout: saved (as default) once the order succeeds
  group: { type: String, index: true }, // orders paid together in one multi-restaurant checkout share a group id
  reviewed: { type: Boolean, default: false },
  notes: String,
  subtotal: Number, tax: Number, deliveryFee: Number, total: Number,
  commission: Number, restaurantShare: Number, distanceKm: Number,
  discount: { type: Number, default: 0 }, couponCode: String, couponBy: String,
  deliveryFeeFull: Number, riderPay: Number, chargesTotal: { type: Number, default: 0 },
  charges: [{ _id: false, name: String, amount: Number, by: String }],
  status: { type: String, default: 'pending_payment', index: true,
    enum: ['pending_payment', 'placed', 'accepted', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'] },
  payment: {
    method: { type: String, enum: ['online', 'cod'], default: 'online' },
    status: { type: String, enum: ['pending', 'paid', 'cod', 'refunded', 'failed'], default: 'pending' },
    rzpOrderId: { type: String, index: true }, rzpPaymentId: String, transferId: String,
    payout: { type: String, enum: ['none', 'held', 'released', 'manual_due', 'manual_paid'], default: 'none' },
  },
  timeline: [{ status: String, at: { type: Date, default: Date.now } }],
}, { timestamps: true });

export const User = models.User || model('User', UserSchema);
export const Restaurant = models.Restaurant || model('Restaurant', RestaurantSchema);
export const MenuItem = models.MenuItem || model('MenuItem', MenuItemSchema);
export const Order = models.Order || model('Order', OrderSchema);

const CategorySchema = new Schema({ name: { type: String, required: true, unique: true, trim: true }, image: String, emoji: String, order: { type: Number, default: 0 }, active: { type: Boolean, default: true }, createdBy: oid('User'), byRole: String }, { timestamps: true });
const ImageSchema = new Schema({ data: Buffer, contentType: String, owner: oid('User') }, { timestamps: true });
export const Address = models.Address || model('Address', AddressSchema);
export const Category = models.Category || model('Category', CategorySchema);
export const Image = models.Image || model('Image', ImageSchema);

const SettingsSchema = new Schema({
  key: { type: String, default: 'main', unique: true },
  freeDeliveryEnabled: { type: Boolean, default: true }, freeDeliveryAbove: { type: Number, default: 200 },
  deliveryBaseFee: { type: Number, default: 25 }, deliveryPerKm: { type: Number, default: 8 }, maxDeliveryKm: { type: Number, default: 15 },
  riderSharePct: { type: Number, default: 80 }, taxPct: { type: Number, default: 5 }, platformFee: { type: Number, default: 5 },
  defaultCommissionPct: { type: Number, default: 15 },
  extraCharges: [{ _id: false, name: String, type: { type: String, enum: ['flat', 'percent'], default: 'flat' }, value: Number, active: { type: Boolean, default: true } }],
}, { timestamps: true });
const CouponSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: String,
  type: { type: String, enum: ['percent', 'flat'], default: 'percent' }, value: { type: Number, required: true, min: 0 },
  maxDiscount: { type: Number, default: 0 }, minOrder: { type: Number, default: 0 },
  scope: { type: String, enum: ['platform', 'restaurant'], default: 'platform' }, restaurant: oid('Restaurant'),
  usageLimit: { type: Number, default: 0 }, perUserLimit: { type: Number, default: 0 }, usedCount: { type: Number, default: 0 },
  firstOrderOnly: { type: Boolean, default: false }, validFrom: Date, validTo: Date, active: { type: Boolean, default: true },
}, { timestamps: true });
const ReviewSchema = new Schema({
  customer: { ...oid('User'), index: true }, customerName: String,
  restaurant: { ...oid('Restaurant'), index: true },
  order: { ...oid('Order'), unique: true },
  rating: { type: Number, min: 1, max: 5, required: true }, comment: String,
  dishes: [{ _id: false, item: oid('MenuItem'), name: String, rating: { type: Number, min: 1, max: 5 } }],
}, { timestamps: true });
export const Review = models.Review || model('Review', ReviewSchema);
export const Settings = models.Settings || model('Settings', SettingsSchema);
export const Coupon = models.Coupon || model('Coupon', CouponSchema);

// Customer cart, saved server-side while logged in: [{ restaurant:{_id,name,image}, items:[{_id,name,price,veg,image,qty}] }]
const CartSchema = new Schema({ user: { ...oid('User'), unique: true, required: true }, carts: { type: Schema.Types.Mixed, default: [] } }, { timestamps: true });
export const Cart = models.Cart || model('Cart', CartSchema);
