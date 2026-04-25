"use client";

import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type Props = {
  userLat?: number;
  userLon?: number;
  schapenweideLat: number;
  schapenweideLon: number;
};

export default function PlanLocatieMap({
  userLat,
  userLon,
  schapenweideLat,
  schapenweideLon,
}: Props) {
  const hasUser = typeof userLat === "number" && typeof userLon === "number";
  const center: [number, number] = hasUser
    ? [(userLat! + schapenweideLat) / 2, (userLon! + schapenweideLon) / 2]
    : [schapenweideLat, schapenweideLon];
  const bounds: [[number, number], [number, number]] | undefined = hasUser
    ? [
        [Math.min(userLat!, schapenweideLat), Math.min(userLon!, schapenweideLon)],
        [Math.max(userLat!, schapenweideLat), Math.max(userLon!, schapenweideLon)],
      ]
    : undefined;

  return (
    <MapContainer
      center={center}
      zoom={hasUser ? 13 : 15}
      bounds={bounds}
      boundsOptions={{ padding: [40, 40] }}
      scrollWheelZoom={false}
      style={{
        width: "100%",
        aspectRatio: "4/3",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[schapenweideLat, schapenweideLon]} icon={defaultIcon}>
        <Popup>Plangebied Schapenweide</Popup>
      </Marker>
      {hasUser && (
        <>
          <Marker position={[userLat!, userLon!]} icon={defaultIcon}>
            <Popup>Jouw adres</Popup>
          </Marker>
          <Polyline
            positions={[
              [userLat!, userLon!],
              [schapenweideLat, schapenweideLon],
            ]}
            pathOptions={{ color: "#406A2C", weight: 3, dashArray: "6 8" }}
          />
        </>
      )}
    </MapContainer>
  );
}
