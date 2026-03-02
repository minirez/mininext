/**
 * Plugin: Inject analytics & tracking scripts from partner site settings
 */
export default defineNuxtPlugin(() => {
  const partner = usePartnerStore()
  const tracking = partner.tracking

  // Google Analytics
  if (tracking?.googleAnalytics?.enabled && tracking.googleAnalytics.measurementId) {
    const gaId = tracking.googleAnalytics.measurementId
    useHead({
      script: [
        { src: `https://www.googletagmanager.com/gtag/js?id=${gaId}`, async: true },
        {
          innerHTML: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`,
        },
      ],
    })
  }

  // Google Tag Manager
  if (tracking?.googleTagManager?.enabled && tracking.googleTagManager.containerId) {
    const gtmId = tracking.googleTagManager.containerId
    useHead({
      script: [
        {
          innerHTML: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`,
        },
      ],
    })
  }

  // Facebook Pixel
  if (tracking?.facebookPixel?.enabled && tracking.facebookPixel.pixelId) {
    const pixelId = tracking.facebookPixel.pixelId
    useHead({
      script: [
        {
          innerHTML: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`,
        },
      ],
    })
  }

  // Microsoft Clarity
  if (tracking?.microsoftClarity?.enabled && tracking.microsoftClarity.projectId) {
    const clarityId = tracking.microsoftClarity.projectId
    useHead({
      script: [
        {
          innerHTML: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarityId}");`,
        },
      ],
    })
  }

  // Custom head/body scripts
  if (tracking?.customScripts?.head) {
    useHead({
      script: [{ innerHTML: tracking.customScripts.head }],
    })
  }
})
