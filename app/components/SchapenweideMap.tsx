"use client";

import { useEffect, useRef } from "react";

export default function SchapenweideMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;

    // Leaflet must be imported client-side only
    import("leaflet").then((L) => {
      // Fix default icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        iconUrl: "/leaflet/marker-icon.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      });

      const map = L.map(mapRef.current!).setView([52.1102, 5.1945], 16);

      // Kadaster WMS tile layer — free, no auth required
      L.tileLayer.wms(
        "https://service.pdok.nl/kadaster/kadastralekaart/wms/v5_0",
        {
          layers: "Perceel",
          format: "image/png",
          transparent: true,
          attribution: "© Kadaster",
        }
      ).addTo(map);

      // Base OpenStreetMap layer underneath
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        opacity: 0.6,
      }).addTo(map);

      // Load Schapenweide parcel polygon
      fetch("/api/parcel")
        .then((r) => r.json())
        .then((geojson) => {
          const layer = L.geoJSON(geojson, {
            style: {
              color: "#f59e0b",
              weight: 3,
              fillColor: "#fbbf24",
              fillOpacity: 0.35,
            },
          }).addTo(map);

          layer.bindPopup(
            "<strong>Schapenweide, Bilthoven</strong><br/>Proposed residential development<br/>Empty for 10+ years"
          );

          map.fitBounds(layer.getBounds(), { padding: [40, 40] });
        })
        .catch(() => {
          // Fallback: show marker if GeoJSON fails
          L.marker([52.1102, 5.1945])
            .addTo(map)
            .bindPopup("<strong>Schapenweide, Bilthoven</strong>")
            .openPopup();
        });

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      className="w-full rounded-xl overflow-hidden border border-amber-200"
      style={{ height: "360px" }}
    />
  );
}
