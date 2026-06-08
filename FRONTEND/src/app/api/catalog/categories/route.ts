import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT id, name, slug, parent_id, sort_order, status
       FROM categories
       WHERE status = 'active'
       ORDER BY sort_order, id`
    );

    const categories = result.rows.map((row: { id: number; name: string; slug: string; parent_id: number | null }) => {
      const isL1 = row.parent_id === null;
      if (isL1) {
        return {
          id: row.id,
          name: row.name,
          slug: row.slug,
          parentId: 0,
          parentName: '',
          parentSlug: ''
        };
      }
      // Look up parent name from the same result set
      const parent = result.rows.find((r: { id: number; name: string; slug: string }) => r.id === row.parent_id);
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        parentId: row.parent_id,
        parentName: parent?.name || '',
        parentSlug: parent?.slug || ''
      };
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json([], { status: 500 });
  }
}
