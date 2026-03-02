/**
 * Plugin: Lazy-load Mapbox GL CSS (client-only)
 */
export default defineNuxtPlugin(() => {
  useHead({
    link: [
      {
        rel: 'stylesheet',
        href: 'https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.css',
      },
    ],
  })
})
