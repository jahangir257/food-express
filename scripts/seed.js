// node --env-file=.env scripts/seed.js   (creates admin + categories; SEED_DEMO=true adds demo restaurants/accounts)
const mongoose = require('mongoose'), bcrypt = require('bcryptjs');
const U = (id) => `https://images.unsplash.com/${id}?w=600&q=70&auto=format&fit=crop`;
const CATS = [['Biryani', '🍛', 'photo-1563379091339-03b21ab4a4f8'], ['Pizza', '🍕', 'photo-1513104890138-7c749659a591'], ['Burgers', '🍔', 'photo-1568901346375-23c9450c58cd'],
  ['North Indian', '🥘', 'photo-1585937421612-70a008356fbe'], ['Chinese', '🍜', 'photo-1585032226651-759b368d7246'], ['South Indian', '🥞', 'photo-1630383249896-424e482df921'],
  ['Healthy', '🥗', 'photo-1512621776951-a57141f2eefd'], ['Desserts', '🍰', 'photo-1578985545062-69928b1d9587'], ['Rolls', '🌯', 'photo-1626700051175-6818013e1d4f'], ['Beverages', '🥤', 'photo-1556679343-c7306c1976bc']];
(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection;
  const users = db.collection('users'), rests = db.collection('restaurants'), menu = db.collection('menuitems'), cats = db.collection('categories');
  const now = new Date();
  const mk = async (email, name, role, pw, doc = {}) => {
    const ex = await users.findOne({ email }); if (ex) return ex._id;
    return (await users.insertOne({ name, email, phone: '9000000000', role, approved: true, passwordHash: await bcrypt.hash(pw, 12), createdAt: now, updatedAt: now, ...doc })).insertedId;
  };
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env');
  await mk(process.env.ADMIN_EMAIL.toLowerCase(), 'Admin', 'admin', process.env.ADMIN_PASSWORD);
  for (const [i, [name, emoji, id]] of CATS.entries()) if (!(await cats.findOne({ name }))) await cats.insertOne({ name, emoji, image: U(id), order: i, active: true });
  await db.collection('settings').updateOne({ key: 'main' }, { $setOnInsert: { key: 'main', freeDeliveryEnabled: true, freeDeliveryAbove: 200, deliveryBaseFee: 25, deliveryPerKm: 8, maxDeliveryKm: 15, riderSharePct: 80, taxPct: 5, platformFee: 5, defaultCommissionPct: 15, extraCharges: [], createdAt: now, updatedAt: now } }, { upsert: true });
  const coupons = db.collection('coupons');
  const mkc = async (c) => { if (!(await coupons.findOne({ code: c.code }))) await coupons.insertOne({ validFrom: null, validTo: null, usageLimit: 0, perUserLimit: 1, usedCount: 0, firstOrderOnly: false, maxDiscount: 0, minOrder: 0, active: true, createdAt: now, updatedAt: now, ...c }); };
  await mkc({ code: 'WELCOME50', description: '₹50 off on your first order', type: 'flat', value: 50, minOrder: 199, scope: 'platform', firstOrderOnly: true });
  await mkc({ code: 'FOODIE20', description: '20% off, up to ₹100', type: 'percent', value: 20, maxDiscount: 100, minOrder: 299, scope: 'platform', perUserLimit: 3 });
  console.log('Admin + categories ready:', process.env.ADMIN_EMAIL);
  if (process.env.SEED_DEMO === 'true') {
    const pw = 'Demo@12345', owner = await mk('owner@demo.com', 'Demo Owner', 'restaurant', pw);
    const I = { b: 'photo-1563379091339-03b21ab4a4f8', p: 'photo-1513104890138-7c749659a591', bg: 'photo-1568901346375-23c9450c58cd', c: 'photo-1585937421612-70a008356fbe', n: 'photo-1585032226651-759b368d7246',
      d: 'photo-1630383249896-424e482df921', s: 'photo-1512621776951-a57141f2eefd', k: 'photo-1578985545062-69928b1d9587', r: 'photo-1626700051175-6818013e1d4f', dr: 'photo-1556679343-c7306c1976bc',
      x1: 'photo-1517248135467-4c7edcad34c4', x2: 'photo-1555396273-367ea4eb4db5', x3: 'photo-1504674900247-0877df9cc836' };
    const M = {
      biryani: [['Chicken Biryani', 220, 0, 'Biryani', 'b'], ['Mutton Biryani', 320, 0, 'Biryani', 'b'], ['Veg Biryani', 160, 1, 'Biryani', 's'], ['Chicken Chaap', 210, 0, 'Mughlai', 'c'], ['Phirni', 80, 1, 'Desserts', 'k'], ['Masala Lassi', 70, 1, 'Drinks', 'dr']],
      pizza: [['Margherita Pizza', 249, 1, 'Pizza', 'p'], ['Farmhouse Pizza', 329, 1, 'Pizza', 'p'], ['Chicken Tikka Pizza', 349, 0, 'Pizza', 'p'], ['Garlic Bread', 129, 1, 'Sides', 'p'], ['Choco Lava Cake', 99, 1, 'Desserts', 'k'], ['Cola', 60, 1, 'Drinks', 'dr']],
      burger: [['Classic Cheeseburger', 169, 0, 'Burgers', 'bg'], ['Crispy Veg Burger', 129, 1, 'Burgers', 'bg'], ['Double Chicken Burger', 229, 0, 'Burgers', 'bg'], ['Peri Peri Fries', 99, 1, 'Sides', 'bg'], ['Chocolate Shake', 140, 1, 'Drinks', 'dr']],
      north: [['Paneer Butter Masala', 220, 1, 'Curries', 'c'], ['Dal Makhani', 190, 1, 'Curries', 'c'], ['Butter Chicken', 290, 0, 'Curries', 'c'], ['Butter Naan', 45, 1, 'Breads', 'c'], ['Tandoori Roti', 25, 1, 'Breads', 'c'], ['Gulab Jamun', 70, 1, 'Desserts', 'k']],
      chinese: [['Veg Hakka Noodles', 160, 1, 'Noodles', 'n'], ['Chicken Hakka Noodles', 190, 0, 'Noodles', 'n'], ['Chilli Chicken', 230, 0, 'Starters', 'n'], ['Veg Manchurian', 170, 1, 'Starters', 'n'], ['Schezwan Fried Rice', 180, 1, 'Rice', 'n'], ['Hot & Sour Soup', 110, 1, 'Soups', 'n']],
      south: [['Masala Dosa', 110, 1, 'Dosa', 'd'], ['Mysore Masala Dosa', 130, 1, 'Dosa', 'd'], ['Idli Sambar (3 pcs)', 80, 1, 'Breakfast', 'd'], ['Medu Vada (2 pcs)', 85, 1, 'Breakfast', 'd'], ['Filter Coffee', 50, 1, 'Drinks', 'dr']],
      healthy: [['Garden Salad Bowl', 180, 1, 'Bowls', 's'], ['Grilled Chicken Bowl', 260, 0, 'Bowls', 's'], ['Quinoa Veggie Bowl', 230, 1, 'Bowls', 's'], ['Fresh Orange Juice', 90, 1, 'Drinks', 'dr'], ['Cold Coffee', 110, 1, 'Drinks', 'dr']],
      dessert: [['Chocolate Cake Slice', 120, 1, 'Cakes', 'k'], ['Red Velvet Pastry', 110, 1, 'Cakes', 'k'], ['Brownie with Ice Cream', 150, 1, 'Desserts', 'k'], ['Rasgulla (4 pcs)', 90, 1, 'Sweets', 'k'], ['Mishti Doi', 70, 1, 'Sweets', 'k']],
      rolls: [['Egg Chicken Roll', 110, 0, 'Rolls', 'r'], ['Chicken Kathi Roll', 130, 0, 'Rolls', 'r'], ['Paneer Tikka Roll', 120, 1, 'Rolls', 'r'], ['Mutton Seekh Roll', 170, 0, 'Rolls', 'r'], ['Veg Chowmein', 100, 1, 'Noodles', 'n']] };
    // name, cuisines, lat, lng, offer, pureVeg, cover image, menus, rating, prep
    const spots = [
      ['Kolkata Biryani House', ['Biryani', 'North Indian'], 22.5726, 88.3639, '20% OFF up to ₹100', false, 'x1', ['biryani', 'north'], 4.4, 30],
      ['Green Bowl Café', ['Healthy', 'Beverages'], 22.5800, 88.3500, 'Free delivery over ₹299', true, 'x2', ['healthy'], 4.5, 20],
      ['Pizza Junction', ['Pizza', 'Burgers'], 22.5650, 88.3700, '', false, 'p', ['pizza', 'burger'], 4.1, 25],
      ['Arsalan Royal Biryani', ['Biryani', 'North Indian'], 22.5530, 88.3520, 'Flat ₹75 OFF', false, 'b', ['biryani'], 4.6, 35],
      ['Dosa Darbar', ['South Indian', 'Healthy'], 22.5870, 88.4150, '10% OFF', true, 'd', ['south'], 4.3, 20],
      ['Wok & Roll', ['Chinese', 'Rolls'], 22.5790, 88.4230, 'Buy 1 Get 1 on noodles', false, 'n', ['chinese', 'rolls'], 4.0, 25],
      ['The Burger Shack', ['Burgers', 'Beverages'], 22.5740, 88.4310, '30% OFF up to ₹120', false, 'bg', ['burger'], 4.2, 18],
      ['Roll Express', ['Rolls', 'Chinese'], 22.5690, 88.4380, '', false, 'r', ['rolls', 'chinese'], 4.3, 15],
      ['Mughlai Darbar', ['North Indian', 'Biryani'], 22.5920, 88.4100, 'Free dessert on ₹499+', false, 'c', ['north', 'biryani'], 4.5, 35],
      ['Sweet Tooth Bakery', ['Desserts', 'Beverages'], 22.5760, 88.4270, '15% OFF', true, 'k', ['dessert'], 4.4, 15],
      ['Saffron Pure Veg', ['North Indian', 'South Indian'], 22.5610, 88.4050, 'Free delivery', true, 'c', ['north', 'south'], 4.2, 30],
      ['Dragon Express', ['Chinese'], 22.5480, 88.3880, '20% OFF up to ₹80', false, 'n', ['chinese'], 4.1, 25],
      ['Slice of Italy', ['Pizza', 'Desserts'], 22.5830, 88.4450, 'Combo from ₹299', false, 'p', ['pizza', 'dessert'], 4.4, 25],
      ['Fresh & Fit Kitchen', ['Healthy', 'Beverages'], 22.5950, 88.4290, '', true, 's', ['healthy', 'dessert'], 4.6, 20]];
    for (const [i, [name, cuisines, lat, lng, offer, pureVeg, cover, kinds, rating, prep]] of spots.entries()) {
      if (await rests.findOne({ name })) continue;
      const r = await rests.insertOne({ name, cuisines, offer, pureVeg, image: U(I[cover]), description: 'Freshly cooked, delivered hot.', owner: i === 0 ? owner : null, address: 'Kolkata', approved: true, isOpen: true, commissionPct: 15, charges: i % 2 === 0 ? [{ name: 'Packaging charge', amount: 10 }] : [], rating, prepMinutes: prep, deliveryRadiusKm: 10, location: { type: 'Point', coordinates: [lng, lat] }, createdAt: now, updatedAt: now });
      if (i === 0) await users.updateOne({ _id: owner }, { $set: { restaurant: r.insertedId } });
      const dishes = kinds.flatMap((k) => M[k]).filter((d, ix, a) => a.findIndex((x) => x[0] === d[0]) === ix).filter((d) => !pureVeg || d[2]);
      await menu.insertMany(dishes.map(([n, price, v, c, im]) => ({ restaurant: r.insertedId, name: n, price, veg: !!v, category: c, image: U(I[im]), description: 'House special, made fresh.', available: true, tags: [], baseOrders: Math.floor(20 + Math.random() * 280), createdAt: now, updatedAt: now })));
    }
    const first = await rests.findOne({ name: 'Kolkata Biryani House' });
    if (first) await mkc({ code: 'BIRYANI10', description: '10% off at Kolkata Biryani House', type: 'percent', value: 10, maxDiscount: 60, minOrder: 150, scope: 'restaurant', restaurant: first._id });
    await mk('customer@demo.com', 'Demo Customer', 'customer', pw);
    await mk('rider@demo.com', 'Demo Rider', 'rider', pw, { rider: { online: false, busy: false, vehicle: 'Bike' } });
    console.log('Demo logins (password Demo@12345): owner@demo.com, customer@demo.com, rider@demo.com');
  }
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
