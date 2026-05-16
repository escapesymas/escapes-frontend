import { useState, useEffect } from 'react';
import { User } from '../types';
import { getSession, saveSession } from '../services/auth';
import { fetchCustomerByEmail } from '../services/woocommerce';
import { fetchGarage } from '../services/garage';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const initialize = async () => {
      const savedUser = getSession();
      if (savedUser) {
        let currentUser = savedUser as unknown as User;
        
        // AUTO-REPAIR Logic
        if ((!currentUser.id || currentUser.id === 0) && (currentUser.email || (savedUser as any).user_email)) {
          try {
            const email = currentUser.email || (savedUser as any).user_email;
            const freshData = await fetchCustomerByEmail(email);
            if (freshData && freshData.id > 0) {
              currentUser = { ...currentUser, ...freshData, token: (savedUser as any).token };
              saveSession(currentUser);
            }
          } catch (e) { 
            console.error('Error auto-repairing session', e); 
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
    };
    
    initialize();
  }, []);

  return { user, setUser };
}
