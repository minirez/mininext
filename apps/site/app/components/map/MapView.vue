<template>
  <div ref="mapContainer" class="w-full h-full" />
</template>

<script setup lang="ts">
const props = defineProps<{
  hotels: any[]
}>()

const mapContainer = ref<HTMLElement>()
const config = useRuntimeConfig()

onMounted(async () => {
  if (!mapContainer.value || !config.public.mapboxToken) return

  const mapboxgl = await import('mapbox-gl')
  mapboxgl.default.accessToken = config.public.mapboxToken as string

  // Calculate center from hotels
  const validHotels = props.hotels.filter(
    h => h.address?.coordinates?.lat && h.address?.coordinates?.lng
  )
  const center = validHotels.length
    ? [
        validHotels.reduce((s, h) => s + h.address.coordinates.lng, 0) / validHotels.length,
        validHotels.reduce((s, h) => s + h.address.coordinates.lat, 0) / validHotels.length
      ]
    : [29.0, 41.0] // Default: Istanbul

  const map = new mapboxgl.default.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: center as [number, number],
    zoom: 10
  })

  // Add markers for each hotel
  for (const hotel of validHotels) {
    const el = document.createElement('div')
    el.className = 'hotel-marker'
    el.innerHTML = `<div style="background:#3B82F6;color:white;padding:4px 8px;border-radius:6px;font-size:12px;font-weight:600;white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.2);cursor:pointer;">${hotel.name}</div>`

    new mapboxgl.default.Marker({ element: el })
      .setLngLat([hotel.address.coordinates.lng, hotel.address.coordinates.lat])
      .setPopup(
        new mapboxgl.default.Popup({ offset: 25 }).setHTML(
          `<div style="padding:4px"><strong>${hotel.name}</strong><br/><small>${hotel.address?.city || ''}</small></div>`
        )
      )
      .addTo(map)
  }

  map.addControl(new mapboxgl.default.NavigationControl(), 'top-right')

  // Fit bounds if multiple hotels
  if (validHotels.length > 1) {
    const bounds = new mapboxgl.default.LngLatBounds()
    validHotels.forEach(h => bounds.extend([h.address.coordinates.lng, h.address.coordinates.lat]))
    map.fitBounds(bounds, { padding: 50 })
  }
})
</script>
