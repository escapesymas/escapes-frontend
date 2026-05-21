import { useState, useEffect } from 'react';
import { User } from '../types';
import { getSession, saveSession } from '../services/auth';
import { fetchCustomerByEmail } from '../services/woocommerce';
import { fetchGarage } from '../services/garage';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        const savedUser = getSession();
        if (savedUser) {
          let currentUser = savedUser as unknown as User;
          
          // ALWAYS fetch fresh profile data on initialization to synchronize DB state (avatars, ranks, etc)
          const email = currentUser.email || (savedUser as any).user_email;
          if (email) {
            try {
              const freshData = await fetchCustomerByEmail(email);
              if (freshData) {
                // Ensure we merge fresh DB fields (like avatarUrl, rank, firstName, etc)
                currentUser = { ...currentUser, ...freshData, token: (savedUser as any).token };
                saveSession(currentUser);
              }
            } catch (e) {
              console.error('Error fetching fresh user session', e);
            }
          }

          // CARGAR GARAJE DESDE POSTGRES
          try {
            const email = currentUser.email || (savedUser as any).user_email;
            if (email) {
              const garage = await fetchGarage(email);
              currentUser = { ...currentUser, garage };
            }
          } catch (e) {
            console.error('Error loading garage from Postgres', e);
          }

          setUser(currentUser);
        }
      } finally {
        setLoading(false);
      }
    };
    
    initialize();
  }, []);

  return { user, setUser, loading };
}
