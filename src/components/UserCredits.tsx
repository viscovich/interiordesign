import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { getUserProfile } from '../lib/userService';

export function UserCredits() {
  const [credits, setCredits] = useState<number>(0);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCredits = async () => {
      if (user?.id) {
        try {
          const profile = await getUserProfile(user.id);
          setCredits(profile.credits);
        } catch (error) {
          console.error('Failed to fetch credits:', error);
        }
      }
    };

    fetchCredits();
  }, [user]);

  return (
    <div className="user-credits">
      <h3>Available Credits</h3>
      <p>{credits} credits remaining</p>
    </div>
  );
}
