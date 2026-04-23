"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

export default function LiveLocation() {
  const [place, setPlace] = useState("Detecting...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setPlace("Location unavailable");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { cache: "no-store" }
          );
          if (res.ok) {
            const data = await res.json();
            const name =
              data.address?.village ||
              data.address?.town ||
              data.address?.city ||
              data.address?.county ||
              data.address?.state ||
              "Your Location";
            setPlace(name);
          } else {
            setPlace("Your Location");
          }
        } catch {
          setPlace("Your Location");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setPlace("Location denied");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  return (
    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <MapPin size={14} />
      {loading ? (
        <span style={{ opacity: 0.6 }}>📍 Detecting...</span>
      ) : (
        <>Near {place}</>
      )}
    </span>
  );
}
