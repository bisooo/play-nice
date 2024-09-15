import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import UserManager from '../../../../lib/userManager';
import { authOptions } from '@/lib/authOptions';
import { UserService } from '@/services/userServices';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await UserManager.getUserById(session.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the update has been run recently
    const lastUpdateTime = user.lastTopItemsUpdate;
    const currentTime = new Date();
    const timeSinceLastUpdate = lastUpdateTime ? currentTime.getTime() - lastUpdateTime.getTime() : Infinity;

    // Only update if it's been more than 24 hours since the last update
    if (timeSinceLastUpdate > 24 * 60 * 60 * 1000) {
      await UserService.updateUserTopItems(user.id, session);
      await UserManager.updateLastTopItemsUpdate(user.id, currentTime);
      return NextResponse.json({ message: 'YOUR DATA HAS BEEN UPDATED!' });
    } else {
      return NextResponse.json({ message: 'YOUR DATA IS UP TO DATE!' });
    }
  } catch (error) {
    console.error('Error updating top items:', error);
    return NextResponse.json({ error: 'Failed to update top items' }, { status: 500 });
  }
}