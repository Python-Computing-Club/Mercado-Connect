import React, { useState, useEffect, useRef } from "react";
import styles from "../components/AtualizarDadosUser/DadosEndereco.module.css";

const DEFAULT_LOCATION = { lat: -23.55052, lng: -46.633308 };
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

let googleMapsPromise;

function loadGoogleMapsScript(apiKey) {
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    if (document.getElementById("google-maps-script")) {
      return resolve();
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

export default function AddressPicker({ initialAddress = "", initialPosition = null, onChange }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);
  const autocompleteRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const [position, setPosition] = useState(initialPosition || DEFAULT_LOCATION);
  const [address, setAddress] = useState(initialAddress);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(true);

  function parseAddressComponents(components) {
    const data = {
      rua: "",
      bairro: "",
      cidade: "",
      estado: "",
      cep: "",
      numero: "",
    };

    components.forEach((component) => {
      const types = component.types;

      if (types.includes("route")) data.rua = component.long_name;
      if (types.includes("street_number")) data.numero = component.long_name;
      if (types.includes("sublocality") || types.includes("sublocality_level_1"))
        data.bairro = component.long_name;
      if (types.includes("administrative_area_level_2")) data.cidade = component.long_name;
      if (types.includes("administrative_area_level_1")) data.estado = component.short_name;
      if (types.includes("postal_code")) data.cep = component.long_name;
    });

    return data;
  }

  async function reverseGeocode(pos) {
    return new Promise((resolve, reject) => {
      if (!geocoderRef.current) return reject(new Error("Geocoder não inicializado."));
      geocoderRef.current.geocode({ location: pos }, (results, status) => {
        if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
          const formatted = results[0].formatted_address;
          const components = results[0].address_components;
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

      const marker = new google.maps.Marker({
        position: pos,
        map,
        draggable: true,
      });

      marker.addListener("dragend", async (e) => {
        const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setPosition(newPos);
        try {
          const { formatted, components } = await reverseGeocode(newPos);
          const parsed = parseAddressComponents(components);
          setAddress(formatted);
          onChange({ address: formatted, position: newPos, ...parsed });
        } catch (err) {
          console.error(err);
        }
      });

      markerRef.current = marker;
      mapInstanceRef.current = map;

      const input = document.getElementById("addressInput");
      autocompleteRef.current = new google.maps.places.Autocomplete(input, {
        fields: ["formatted_address", "geometry", "name", "address_components"],
        types: ["geocode"],
      });

      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current.getPlace();
        if (!place.geometry || !place.geometry.location) {
          setError("Não foi possível localizar o endereço selecionado.");
          return;
        }

        const loc = place.geometry.location;
        const pos = { lat: loc.lat(), lng: loc.lng() };
        const parsed = parseAddressComponents(place.address_components || []);

        setPosition(pos);
        setAddress(place.formatted_address || place.name || "");
        map.panTo(pos);
        marker.setPosition(pos);
        onChange({ address: place.formatted_address, position: pos, ...parsed });
      });

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message || "Erro ao carregar o Google Maps.");
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!showModal) {
      initMap(position);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, position]);

  async function handlePermissionResponse(accepted) {
    setShowModal(false);

    await loadGoogleMapsScript(GOOGLE_MAPS_API_KEY);

    if (accepted && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const userPos = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setPosition(userPos);
          await initMap(userPos);
          try {
            const { formatted, components } = await reverseGeocode(userPos);
            const parsed = parseAddressComponents(components);
            setAddress(formatted);
            onChange({ address: formatted, position: userPos, ...parsed });
          } catch (err) {
            console.error(err);
            setError("Erro ao obter endereço da localização.");
          }
        },
        () => {
          setError("Não foi possível obter sua localização.");
          initMap(position);
        }
      );
    } else {
      initMap(position);
    }
  }

  async function buscarEnderecoManual() {
    if (!address.trim()) return;
    try {
      const google = window.google;
      const geocoder = new google.maps.Geocoder();
      const results = await new Promise((resolve, reject) => {
        geocoder.geocode({ address }, (res, status) => {
          if (status === "OK" && res[0]) resolve(res);
          else reject("Endereço não encontrado.");
        });
      });

      const loc = results[0].geometry.location;
      const newPos = { lat: loc.lat(), lng: loc.lng() };
      const parsed = parseAddressComponents(results[0].address_components);

      setPosition(newPos);
      markerRef.current?.setPosition(newPos);
      mapInstanceRef.current?.panTo(newPos);
      setAddress(results[0].formatted_address);
      onChange({ address: results[0].formatted_address, position: newPos, ...parsed });
    } catch (err) {
      console.error(err);
      setError("Erro ao buscar endereço.");
    }
  }

  return (
    <div className={styles.addressPickerWrapper}>
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalPanel}>
            <h3>Permitir acesso à sua localização?</h3>
            <p>
              Isso ajuda a centralizar o mapa no seu endereço atual.
              <br />
              <strong>Se aceitar, os dados informados na primeira tela serão sobrescritos.</strong>
            </p>
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button className={styles.continueBtn} onClick={() => handlePermissionResponse(true)}>Permitir</button>
              <button className={styles.continueBtn} onClick={() => handlePermissionResponse(false)}>Negar</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <input
          id="addressInput"
          value={address}
          placeholder="Digite o endereço"
          className={styles.input}
          onChange={(e) => setAddress(e.target.value)}
        />
        <button className={styles.continueBtn} onClick={buscarEnderecoManual}>
          Buscar endereço
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      <div ref={mapRef} className={styles.mapContainer}></div>

      <div className={styles.mapStatus}>
        <div><strong>Latitude:</strong> {position?.lat?.toFixed(6)}</div>
        <div><strong>Longitude:</strong> {position?.lng?.toFixed(6)}</div>
        <div className={styles.mapLoading}>{loading ? "Carregando mapa..." : "Pronto"}</div>
      </div>
    </div>
  );
}