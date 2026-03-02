<template>
  <div ref="mapContainer" class="w-full h-full" />
</template>

<script setup lang="ts">
const props = defineProps<{
  coordinates: { lat: number; lng: number }
  name: string
}>()

const mapContainer = ref<HTMLElement>()
const config = useRuntimeConfig()

onMounted(async () => {
  if (!mapContainer.value || !props.coordinates.lat || !props.coordinates.lng) return
  if (!config.public.mapboxToken) return

  const mapboxgl = await import('mapbox-gl')
  mapboxgl.default.accessToken = config.public.mapboxToken as string

  const map = new mapboxgl.default.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [props.coordinates.lng, props.coordinates.lat],
    zoom: 14,
    interactive: true
  })

  new mapboxgl.default.Marker({ color: '#3B82F6' })
    .setLngLat([props.coordinates.lng, props.coordinates.lat])
    .setPopup(new mapboxgl.default.Popup().setHTML(`<strong>${props.name}</strong>`))
    .addTo(map)

  map.addControl(new mapboxgl.default.NavigationControl(), 'top-right')
})
</script>
