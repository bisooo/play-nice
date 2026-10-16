import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/apiUtils';
import { getOwner } from '@/lib/owner';
import { UserService } from '@/services/userServices';

// Public: called on every page load; only syncs the owner's top items when they're over 24h old,
// so repeated calls cost one DB write at most
export async function POST() {
  try {
    const { user, spotify } = await getOwner();
    const updated = await UserService.syncTopItemsIfStale(user, spotify);
    return NextResponse.json({ updated });
  } catch (error) {
    console.error('Error updating top items:', error);
    return handleApiError(error);
  }
}
