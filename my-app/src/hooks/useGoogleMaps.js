import { useEffect, useRef, useState } from 'react';

const scriptId = 'google-maps-script';

const loadScript = (src) =>
  new Promise((resolve, reject) => {
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.addEventListener('load', resolve);
      existingScript.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = src;
    script.async = true;
    script.defer = true;

    script.addEventListener('load', resolve);
    script.addEventListener('error', reject);

    document.body.appendChild(script);
  });

const useGoogleMaps = ({ apiKey, onScriptBlocked }) => {
  const [status, setStatus] = useState(apiKey ? 'idle' : 'missing-key');
  const [mapError, setMapError] = useState(null);
  const googleRef = useRef(null);

  useEffect(() => {
    if (!apiKey) {
      setMapError('Google Maps API key missing.');
      onScriptBlocked?.();
      return;
    }

    const scriptSrc = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;

    if (window.google?.maps) {
      googleRef.current = window.google;
      setStatus('ready');
      return;
    }

    setStatus('loading');
    loadScript(scriptSrc)
      .then(() => {
        googleRef.current = window.google;
        setStatus('ready');
      })
      .catch((error) => {
        console.error('Failed to load Google Maps', error);
        setMapError('Unable to load Google Maps. Check your API key and network connectivity.');
        setStatus('error');
        onScriptBlocked?.();
      });
  }, [apiKey, onScriptBlocked]);

  return {
    status,
    google: googleRef.current,
    mapError
  };
};

export default useGoogleMaps;
