import { handler, ok } from '@/lib/api';
import { Category } from '@/lib/models';
export const dynamic = 'force-dynamic';
export const withNew = (c) => ({ ...c, isNew: !!c.createdAt && Date.now() - new Date(c.createdAt).getTime() < 14 * 864e5 });
export const GET = handler(async () => ok({ categories: (await Category.find({ active: true }).sort('order name').lean()).map(withNew) }));
