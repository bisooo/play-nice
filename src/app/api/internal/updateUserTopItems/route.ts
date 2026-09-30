import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import UserManager from '../../../../lib/userManager';
import { authOptions } from '@/lib/authOptions';
import { UserService } from '@/services/userServices';

const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

// Called by the client on every signed-in page load; only syncs when data is over 24h old
export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session || !session.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await UserManager.getUserById(session.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    const claimed = await UserManager.claimTopItemsSync(user.spotifyId, new Date(now.getTime() - SYNC_INTERVAL_MS), now);
    if (!claimed) {
      return NextResponse.json({ updated: false });
    }

    try {
      await UserService.updateUserTopItems(user.id, session);
    } catch (error) {
      // Release the claim so the next visit retries
      await UserManager.updateLastTopItemsUpdate(user.id, user.lastTopItemsUpdate);
      throw error;
    }
    return NextResponse.json({ updated: true });
  } catch (error) {
    console.error('Error updating top items:', error);
    return NextResponse.json({ error: 'Failed to update top items' }, { status: 500 });
  }
}
