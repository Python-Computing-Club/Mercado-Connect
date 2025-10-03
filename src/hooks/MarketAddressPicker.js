import React, { useState, useEffect, useRef } from "react";
import styles from "../components/AtualizarDadosUser/DadosEndereco.module.css";

const DEFAULT_LOCATION = { lat: -23.55052, lng: -46.633308 };
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

let googleMapsPromise;

function loadGoogleMapsScript(apiKey) {
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    if (document.getElementById("google-maps-script")) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

function parseAddressComponents(components = []) {
  const result = {
    street_number: "",
    route: "",
    sublocality: "",
    locality: "",
    administrative_area_level_1: "",
    postal_code: "",
    country: "",
  };
  components.forEach(comp => {
    const types = comp.types;
    if (types.includes("street_number")) result.street_number = comp.long_name;
    if (types.includes("route")) result.route = comp.long_name;
    if (
      types.includes("sublocality") ||
      types.includes("sublocality_level_1") ||
      types.includes("neighborhood")
    ) {
      result.sublocality = comp.long_name;
    }
    if (types.includes("locality")) result.locality = comp.long_name;
    if (types.includes("administrative_area_level_1")) {
      result.administrative_area_level_1 = comp.short_name || comp.long_name;
    }
    if (types.includes("postal_code")) result.postal_code = comp.long_name;
    if (types.includes("country")) result.country = comp.long_name;
  });

  if (!result.locality) {
    const alt = components.find(comp => comp.types.includes("administrative_area_level_2"));
    if (alt) {
      result.locality = alt.long_name;
    }
  }

  return result;
}

export default function MarketAddressPicker({ initialAddress = "", initialPosition = null, onChange }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);
  const autocompleteRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const [position, setPosition] = useState(initialPosition || DEFAULT_LOCATION);
  const [address, setAddress] = useState(initialAddress);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function reverseGeocode(pos) {
    if (!geocoderRef.current) throw new Error("Geocoder não inicializado.");
    return new Promise((resolve, reject) => {
      geocoderRef.current.geocode({ location: pos }, (results, status) => {
        if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
          const formatted = results[0].formatted_address;
          const components = parseAddressComponents(results[0].address_components);
          resolve({ formatted, components });
        } else {
          reject(new Error("Reverse geocode falhou: " + status));
        }
      });
    });
  }

  async function initMap(pos) {
    try {
      await loadGoogleMapsScript(GOOGLE_MAPS_API_KEY);
      const google = window.google;
      if (!google || !google.maps) throw new Error("Google Maps não carregou.");

      geocoderRef.current = new google.maps.Geocoder();

      const map = new google.maps.Map(mapRef.current, {
        center: pos,
        zoom: 16,
        streetViewControl: false,
      });

      mapInstanceRef.current = map;

      const marker = new google.maps.Marker({
        position: pos,
        map,
        draggable: true,
      });

      markerRef.current = marker;

      marker.addListener("dragend", async (e) => {
        const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setPosition(newPos);
        try {
          const { formatted, components } = await reverseGeocode(newPos);
          setAddress(formatted);
          onChange({ address: formatted, position: newPos, components });
        } catch (err) {
          console.error("Erro reverseGeocode no dragend:", err);
        }
      });

      const input = document.getElementById("addressInput");
      if (input) {
        autocompleteRef.current = new google.maps.places.Autocomplete(input, {
          fields: ["formatted_address", "geometry", "address_components"],
          types: ["geocode"],
        });

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current.getPlace();
          if (!place || !place.geometry || !place.geometry.location) {
            setError("Não foi possível localizar o endereço selecionado.");
            return;
          }
          const loc = place.geometry.location;
          const posP = { lat: loc.lat(), lng: loc.lng() };

          markerRef.current.setPosition(posP);
          mapInstanceRef.current.panTo(posP);

          const components = parseAddressComponents(place.address_components || []);
          const formatted = place.formatted_address || "";

          setAddress(formatted);
          onChange({ address: formatted, position: posP, components });
        });
      }

      setLoading(false);
    } catch (err) {
      console.error("Erro no initMap:", err);
      setError(err.message || "Erro ao inicializar mapa.");
      setLoading(false);
    }
  }

  useEffect(() => {
    initMap(position);
  }, []);

  async function buscarEnderecoManual() {
    if (!address.trim()) return;

    try {
      if (!window.google || !window.google.maps) throw new Error("Google Maps não está disponível.");

      const geocoder = new window.google.maps.Geocoder();
      const results = await new Promise((resolve, reject) => {
        geocoder.geocode({ address }, (res, status) => {
          if (status === "OK" && res && res[0]) {
            resolve(res);
          } else {
            reject(status);
          }
        });
      });

      const r = results[0];
      const loc = r.geometry.location;
      const newPos = { lat: loc.lat(), lng: loc.lng() };

      const components = parseAddressComponents(r.address_components);
      const formatted = r.formatted_address;

      setAddress(formatted);
      if (markerRef.current) markerRef.current.setPosition(newPos);
      if (mapInstanceRef.current) mapInstanceRef.current.panTo(newPos);

      onChange({ address: formatted, position: newPos, components });
    } catch (err) {
      console.error("Erro em buscarEnderecoManual:", err);
      setError("Erro ao buscar endereço.");
    }
  }

  return (
    <div className={styles.addressPickerWrapper}>
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <input
          id="addressInput"
          value={address}
          placeholder="Digite o endereço"
          className={styles.input}
          onChange={(e) => setAddress(e.target.value)}
          autoComplete="off"
        />
        <button
          className={styles.continueBtn}
          type="button"
          onClick={buscarEnderecoManual}
        >
          Buscar endereço
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div ref={mapRef} className={styles.mapContainer} style={{ height: "400px" }}></div>

      <div className={styles.mapStatus}>
        <div><strong>Latitude:</strong> {position?.lat?.toFixed(6)}</div>
        <div><strong>Longitude:</strong> {position?.lng?.toFixed(6)}</div>
        <div className={styles.mapLoading}>
          {loading ? "Carregando mapa..." : (error ? "Erro ao carregar mapa" : "Pronto")}
        </div>
      </div>
    </div>
  );
}
