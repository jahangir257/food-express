import bcrypt from 'bcryptjs';
import { handler, ok, bad, str, geoPoint } from '@/lib/api';
import { User, Restaurant } from '@/lib/models';
import { signToken, setAuthCookie } from '@/lib/auth';

export const POST = handler(async (req) => {
  const b = await req.json();
  const email = str(b.email, 120).toLowerCase(), name = str(b.name, 80), password = String(b.password || '');
  if (!/^\S+@\S+\.\S+$/.test(email) || !name || password.length < 8) return bad('Valid name, email and password (min 8 chars) required');
  if (await User.exists({ email })) return bad('Email already registered', 409);
  const role = ['customer', 'restaurant', 'rider'].includes(b.role) ? b.role : 'customer';
  const user = new User({ name, email, phone: str(b.phone, 15), role, passwordHash: await bcrypt.hash(password, 12), approved: role === 'customer' });
  if (role === 'restaurant') {
    const r = await Restaurant.create({ name: str(b.restaurantName, 100) || `${name}'s Kitchen`, owner: user._id, address: str(b.address, 250),
      location: geoPoint(b.lat, b.lng) });
    user.restaurant = r._id;
  }
  if (role === 'rider') user.rider = { vehicle: str(b.vehicle, 40) };
  await user.save();
  if (role !== 'customer') return ok({ pending: true, message: 'Registered. An admin must approve your account before you can log in.' }, 201);
  setAuthCookie(await signToken(user));
  return ok({ user: { id: user._id, name, role } }, 201);
}, undefined, { key: 'reg', max: 10, windowMs: 3600e3 });
