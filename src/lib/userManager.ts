import {prisma} from './prisma'; 

interface UserData {
    spotifyId: string;
    email: string;
    name?: string;
    accessToken?: string;
    refreshToken?: string;
}

class UserManager {
  async upsertUser(userData: UserData) {
    try {
      const { spotifyId, ...data } = userData;
      return await prisma.user.upsert({
        where: { spotifyId: spotifyId },
        update: data,
        create: { 
            spotifyId: userData.spotifyId, 
            email: userData.email,
            name: userData.name,
            accessToken: userData.accessToken,
            refreshToken: userData.refreshToken,
        },
      });
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  }
}

export default new UserManager();
