import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const createOrUpdateUser = async (user) => {
  try {
    const userId = user.uid || user.sub;
    if (!userId) {
      throw new Error('No user ID provided');
    }

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    const userDataToSave = {
      email: user.email,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      lastLoginAt: serverTimestamp(),
      provider: user.provider || 'password',
      updatedAt: serverTimestamp(),
    };

    if (!userSnap.exists()) {
      userDataToSave.createdAt = serverTimestamp();
      userDataToSave.isActive = true;
      userDataToSave.role = 'user';
      userDataToSave.settings = {
        notifications: true,
        theme: 'light',
      };
      userDataToSave.subscriptionStatus = 'free'; // Default status
      userDataToSave.stripeCustomerId = null;
      userDataToSave.subscriptionId = null;
    }

    await setDoc(userRef, userDataToSave, { merge: true });
    return userDataToSave;
  } catch (error) {
    console.error('Error in createOrUpdateUser:', error);
    throw error;
  }
};

export const getUserData = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      return {
        ...userData,
        isPremium: userData.subscriptionStatus === 'active', // Add helper flag
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};