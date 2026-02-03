/**
 * Tour Route Map Composable
 * Leaflet map for tour route stops editor
 */

import { onUnmounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default icon paths
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow
})

const stopIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background-color: #14b8a6; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
})

function createMap(elementId, center, zoom) {
  const map = L.map(elementId, { center, zoom, zoomControl: true })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(map)

  setTimeout(() => map.invalidateSize(), 100)
  return map
}

export function useTourRouteMap() {
  let map = null
  let markers = []

  function initMap(elementId = 'tour-route-map', center = [39.0, 35.0], zoom = 6) {
    if (map) return map
    const el = document.getElementById(elementId)
    if (!el) return null
    map = createMap(elementId, center, zoom)
    return map
  }

  function destroy() {
    if (map) {
      map.remove()
      map = null
      markers = []
    }
  }

  function setStops(stops = [], getLabel = null) {
    if (!map) return
    markers.forEach(m => map.removeLayer(m))
    markers = []

    const bounds = []

    stops.forEach((s, idx) => {
      const coords = s?.locationSnapshot?.coordinates
      if (!coords?.lat || !coords?.lng) return

      const label =
        (typeof getLabel === 'function' ? getLabel(s) : null) ||
        s?.locationSnapshot?.name ||
        `#${idx + 1}`

      const marker = L.marker([coords.lat, coords.lng], { icon: stopIcon })
        .addTo(map)
        .bindPopup(`<strong>${label}</strong>`)

      markers.push(marker)
      bounds.push([coords.lat, coords.lng])
    })

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 })
    }
  }

  function focusOnStop(stop) {
    if (!map) return
    const coords = stop?.locationSnapshot?.coordinates
    if (!coords?.lat || !coords?.lng) return

    const zoom = stop?.locationSnapshot?.zoom || 13
    map.setView([coords.lat, coords.lng], zoom)
  }

  onUnmounted(destroy)

  return { initMap, setStops, focusOnStop, destroy }
}
