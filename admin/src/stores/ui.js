/**
 * UI Store
 * Manages UI state like sidebar visibility, mobile detection, dark mode, page titles, etc.
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useUIStore = defineStore('ui', () => {
	// State
	const sidebarOpen = ref(false)
	const isMobile = ref(false)
	const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

	// Page title state (for dynamic titles set by views)
	const customPageTitle = ref(null)
	const customPageDescription = ref(null)
	const pageTitleSuffix = ref(null) // e.g., hotel name for detail pages

	// Dark mode - check localStorage and system preference
	const getInitialDarkMode = () => {
		if (typeof window === 'undefined') return false
		const stored = localStorage.getItem('darkMode')
		if (stored !== null) return stored === 'true'
		return window.matchMedia('(prefers-color-scheme: dark)').matches
	}
	const darkMode = ref(getInitialDarkMode())

	// Mobile breakpoint (tailwind md breakpoint)
	const MOBILE_BREAKPOINT = 768

	// Computed
	const isDesktop = computed(() => !isMobile.value)

	// Actions
	const toggleSidebar = () => {
		sidebarOpen.value = !sidebarOpen.value
	}

	const openSidebar = () => {
		sidebarOpen.value = true
	}

	const closeSidebar = () => {
		sidebarOpen.value = false
	}

	// Dark mode actions
	const toggleDarkMode = () => {
		darkMode.value = !darkMode.value
		applyDarkMode()
	}

	const setDarkMode = (value) => {
		darkMode.value = value
		applyDarkMode()
	}

	const applyDarkMode = () => {
		if (typeof window === 'undefined') return
		localStorage.setItem('darkMode', darkMode.value)
		if (darkMode.value) {
			document.documentElement.classList.add('dark')
		} else {
			document.documentElement.classList.remove('dark')
		}
	}

	// Sidebar expanded state (wide vs narrow)
	const sidebarExpanded = ref(localStorage.getItem('sidebarExpanded') !== 'false')

	const toggleSidebarExpanded = () => {
		sidebarExpanded.value = !sidebarExpanded.value
		localStorage.setItem('sidebarExpanded', sidebarExpanded.value)
	}

	const checkMobile = () => {
		windowWidth.value = window.innerWidth
		isMobile.value = window.innerWidth < MOBILE_BREAKPOINT

		// Desktop'ta sidebar her zaman acik
		if (!isMobile.value) {
			sidebarOpen.value = true
		}
	}

	// Window resize handler
	let resizeHandler = null

	const initializeUI = () => {
		if (typeof window === 'undefined') return

		checkMobile()
		applyDarkMode()

		resizeHandler = () => {
			checkMobile()
		}

		window.addEventListener('resize', resizeHandler)
	}

	const cleanupUI = () => {
		if (resizeHandler) {
			window.removeEventListener('resize', resizeHandler)
		}
	}

	// Page title actions
	const setPageTitle = (title, description = null) => {
		customPageTitle.value = title
		customPageDescription.value = description
	}

	const setPageTitleSuffix = (suffix) => {
		pageTitleSuffix.value = suffix
	}

	const clearPageTitle = () => {
		customPageTitle.value = null
		customPageDescription.value = null
		pageTitleSuffix.value = null
	}

	return {
		// State
		sidebarOpen,
		sidebarExpanded,
		isMobile,
		windowWidth,
		darkMode,
		customPageTitle,
		customPageDescription,
		pageTitleSuffix,
		// Computed
		isDesktop,
		// Actions
		toggleSidebar,
		openSidebar,
		closeSidebar,
		toggleSidebarExpanded,
		toggleDarkMode,
		setDarkMode,
		applyDarkMode,
		checkMobile,
		initializeUI,
		cleanupUI,
		setPageTitle,
		setPageTitleSuffix,
		clearPageTitle
	}
})
