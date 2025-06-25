// src/pages/Advocate.tsx
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LAWYER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

import React, { useEffect, useState } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
} from "@react-google-maps/api";
import {
  MapPin,
  Star,
  Gavel,
  Phone,
  Map,
  ArrowDownUp,
} from "lucide-react";
import { motion } from "framer-motion";

const containerStyle = {
  width: "100%",
  maxWidth: "900px",
  height: "300px",
  borderRadius: "1rem",
  margin: "0 auto",
  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
};

const centerDefault = {
  lat: 28.6139,
  lng: 77.209,
};

type Lawyer = {
  place_id: string;
  name: string;
  address: string;
  phone?: string | null;
  rating?: number | null;
  reviews?: number | null;
  website?: string | null;
  mapsUrl?: string | null;
  experience?: string;
  distance?: string;
  location?: {
    lat: number;
    lng: number;
  };
  _distanceValue?: number;
};

function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const Advocate: React.FC = () => {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sortKey, setSortKey] = useState<string>("");
  const [selectedLawyerId, setSelectedLawyerId] = useState<string | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        try {
          const res = await fetch(`/api/lawyers/nearby?lat=${latitude}&lng=${longitude}`);
          if (!res.ok) throw new Error("Failed to fetch nearby lawyers");
          const data = await res.json();

          const enriched = (data.results || []).map((lawyer: Lawyer) => {
            if (lawyer.location) {
              const distanceKm = getDistanceInKm(
                latitude,
                longitude,
                lawyer.location.lat,
                lawyer.location.lng
              );
              return {
                ...lawyer,
                distance: `${distanceKm.toFixed(2)} km`,
                _distanceValue: distanceKm,
              };
            }
            return {
              ...lawyer,
              distance: "Distance unavailable",
              _distanceValue: Number.MAX_VALUE,
            };
          });

          setLawyers(enriched);
        } catch (err) {
          console.error(err);
          setError("Failed to load nearby lawyers.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Location permission denied.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const sortedLawyers = [...lawyers].sort((a, b) => {
    if (sortKey === "rating") {
      return (b.rating || 0) - (a.rating || 0);
    } else if (sortKey === "experience") {
      const expA = parseInt(a.experience?.split(" ")[0] || "0");
      const expB = parseInt(b.experience?.split(" ")[0] || "0");
      return expB - expA;
    } else if (sortKey === "distance") {
      return (a._distanceValue || 0) - (b._distanceValue || 0);
    } else {
      return 0;
    }
  });

  return (
    <div className="px-4 sm:px-6 py-10 min-h-screen bg-gray-50">
      <h2 className="text-4xl font-bold text-center text-yellow-600 mb-6">
        👩‍⚖️ Lawyers Near You
      </h2>

      <div
        id="mapContainer"
        className="rounded-xl overflow-hidden mb-10 border border-gray-200"
      >
        <LoadScript googleMapsApiKey={import.meta.env.VITE_LAWYER_API_KEY}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={userLocation || centerDefault}
            zoom={13}
          >
            {userLocation && (
              <Marker
                position={userLocation}
                icon={{ url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" }}
              />
            )}

            {lawyers.map((lawyer) =>
              lawyer.location ? (
                <Marker
  key={lawyer.place_id}
  position={lawyer.location}
  title={lawyer.name}
  icon={
    selectedLawyerId === lawyer.place_id
      ? {
          url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
          scaledSize: new window.google.maps.Size(40, 40),
        }
      : undefined
  }
  animation={
    selectedLawyerId === lawyer.place_id
      ? window.google.maps.Animation.BOUNCE
      : undefined
  }
/>

              ) : null
            )}
          </GoogleMap>
        </LoadScript>
      </div>

      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <p className="text-gray-700 text-sm font-medium">
          Found <span className="font-semibold">{lawyers.length}</span> advocates in your area.
        </p>
        <div className="relative">
          <select
            className="pl-10 pr-4 py-2 text-sm rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition appearance-none bg-white text-gray-700"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
          >
            <option value="">Sort By</option>
            <option value="distance">Nearest</option>
            <option value="rating">Top Rated</option>
            <option value="experience">Most Experienced</option>
          </select>
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <ArrowDownUp size={16} />
          </div>
        </div>
      </div>

      {loading && <p className="text-center text-gray-600">Finding lawyers around you...</p>}
      {error && <p className="text-center text-red-500 font-medium">{error}</p>}
      {!loading && !error && sortedLawyers.length === 0 && (
        <p className="text-center text-gray-500">No lawyers found nearby.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedLawyers.map((lawyer, index) => (
          <motion.div
            key={lawyer.place_id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div
              className={`bg-white rounded-2xl shadow-md p-5 transition-all cursor-pointer ${
                selectedLawyerId === lawyer.place_id
                  ? "border-2 border-yellow-500 shadow-lg"
                  : "border border-gray-200 hover:shadow-xl"
              }`}
              onClick={() => {
                setSelectedLawyerId(lawyer.place_id);
                document
                  .querySelector("#mapContainer")
                  ?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-800">{lawyer.name}</h3>
                {lawyer.rating && (
                  <div className="flex items-center text-yellow-500 text-sm font-medium">
                    <Star size={16} className="mr-1" />
                    {lawyer.rating}
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-600 flex items-center mb-1">
                <Gavel size={16} className="mr-2" />
                {lawyer.experience || "Experience: N/A"}
              </p>

              <p className="text-sm text-gray-600 flex items-center mb-1">
                <MapPin size={16} className="mr-2" />
                {lawyer.address}
              </p>

              {lawyer.phone && (
                <p className="text-sm text-gray-600 flex items-center mb-1">
                  <Phone size={16} className="mr-2" />
                  {lawyer.phone}
                </p>
              )}

              {lawyer.website && (
                <a
                  href={lawyer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 underline block mt-1"
                >
                  Visit Website
                </a>
              )}

              {lawyer.mapsUrl && (
                <a
                  href={lawyer.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 flex items-center mt-1"
                >
                  <Map size={16} className="mr-1" />
                  Open in Google Maps
                </a>
              )}

              {lawyer.distance && (
                <p className="text-sm text-blue-600 font-semibold mt-2">
                  {lawyer.distance}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Advocate;
