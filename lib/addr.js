import { str, num, HttpError } from './api';
export const clean = (b) => {
  const d = { type: ['Home', 'Work', 'Other'].includes(b.type) ? b.type : 'Other', name: str(b.name, 80), phone: str(b.phone, 15), line: str(b.line, 200), landmark: str(b.landmark, 120), area: str(b.area, 300), pincode: str(b.pincode, 10), instructions: str(b.instructions, 200) };
  if (!d.line) throw new HttpError('Flat / house no. is required');
  if (!d.phone) throw new HttpError('Phone number is required');
  d.lat = num(b.lat, 'location'); d.lng = num(b.lng, 'location');
  if (!d.area) throw new HttpError('Please pick the area on the map search');
  return d;
};
