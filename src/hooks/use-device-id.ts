import { useState, useEffect } from 'react';

const DEVICE_ID_KEY = 'storyteller_device_id';

export const useDeviceId = () => {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    
    if (!id) {
      // Generate a random anonymous device ID
      id = 'device_' + crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    
    setDeviceId(id);
  }, []);

  return deviceId;
};
