import { NextResponse } from 'next/server';
import UserManager from '../../../../lib/userManager';
import { handleApiError } from '@/lib/apiUtils';
import { getOwner } from '@/lib/owner';
import { UserService } from '@/services/userServices';

const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

// Public: called on every page load; only syncs the owner's top items when they're over 24h old,
// so repeated calls cost one DB write at most
export async function POST() {
  try {
    const { user, spotify } = await getOwner();

    const now = new Date();
    const claimed = await UserManager.claimTopItemsSync(user.spotifyId, new Date(now.getTime() - SYNC_INTERVAL_MS), now);
    if (!claimed) {
      return NextResponse.json({ updated: false });
    }

    try {
      await UserService.updateUserTopItems(user.id, spotify);
    } catch (error) {
      // Release the claim so the next visit retries
      await UserManager.updateLastTopItemsUpdate(user.id, user.lastTopItemsUpdate);
      throw error;
    }
    return NextResponse.json({ updated: true });
  } catch (error) {
    console.error('Error updating top items:', error);
    return handleApiError(error);
  }
}
