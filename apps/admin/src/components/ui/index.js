/**
 * UI Framework - Main Export File
 * Maxirez UI Component Library
 *
 * Kullanim:
 * import { DataTable, PhoneInput, BaseButton } from '@/components/ui'
 */

// ============================================
// BUTTON COMPONENTS
// ============================================
export { default as BaseButton } from './buttons/BaseButton.vue'
export { default as IconButton } from './buttons/IconButton.vue'
export { default as ActionMenu } from './buttons/ActionMenu.vue'

// ============================================
// FORM COMPONENTS
// ============================================
export { default as PhoneInput } from './form/PhoneInput.vue'
export { default as PasswordInput } from './form/PasswordInput.vue'
export { default as Dropdown } from './form/Dropdown.vue'
export { default as SearchInput } from './form/SearchInput.vue'
export { default as Toggle } from './form/Toggle.vue'
export { default as Checkbox } from './form/Checkbox.vue'
export { default as Radio } from './form/Radio.vue'
export { default as RadioGroup } from './form/RadioGroup.vue'
export { default as Slider } from './form/Slider.vue'
export { default as Rating } from './form/Rating.vue'
export { default as TimePicker } from './form/TimePicker.vue'

// ============================================
// DATE COMPONENTS
// ============================================
export { default as DatePicker } from './date/DatePicker.vue'
export { default as DateRangePicker } from './date/DateRangePicker.vue'
export { default as BirthDatePicker } from './date/BirthDatePicker.vue'

// ============================================
// DATA COMPONENTS
// ============================================
export { default as DataTable } from './data/DataTable.vue'
export { default as StatusBadge } from './data/StatusBadge.vue'

// ============================================
// DISPLAY COMPONENTS
// ============================================
export { default as Avatar } from './display/Avatar.vue'
export { default as AvatarGroup } from './display/AvatarGroup.vue'
export { default as Chip } from './display/Chip.vue'
export { default as Tooltip } from './display/Tooltip.vue'
export { default as Accordion } from './display/Accordion.vue'
export { default as AccordionItem } from './display/AccordionItem.vue'
export { default as Timeline } from './display/Timeline.vue'

// ============================================
// NAVIGATION COMPONENTS
// ============================================
export { default as Tabs } from './navigation/Tabs.vue'
export { default as TabPanel } from './navigation/TabPanel.vue'
export { default as Breadcrumbs } from './navigation/Breadcrumbs.vue'
export { default as Stepper } from './navigation/Stepper.vue'

// ============================================
// FEEDBACK COMPONENTS
// ============================================
export { default as Alert } from './feedback/Alert.vue'
export { default as ConfirmDialog } from './feedback/ConfirmDialog.vue'
export { default as Spinner } from './feedback/Spinner.vue'
export { default as Skeleton } from './feedback/Skeleton.vue'
export { default as Progress } from './feedback/Progress.vue'

// ============================================
// OVERLAY COMPONENTS
// ============================================
export { default as Modal } from './overlay/Modal.vue'
export { default as Drawer } from './overlay/Drawer.vue'

// ============================================
// COMPOSABLES
// ============================================
export { useDebounce, useDebouncedRef, useThrottle } from './composables/useDebounce'
export { usePagination } from './composables/usePagination'
export { useFilters } from './composables/useFilters'
export { useSelection } from './composables/useSelection'

// ============================================
// TYPE DEFINITIONS (JSDoc)
// ============================================

/**
 * @typedef {Object} TableColumn
 * @property {string} key - Sutun key'i (veri alani)
 * @property {string} label - Sutun basligi
 * @property {boolean} [sortable] - Siralanabilir mi?
 * @property {string} [width] - Sutun genisligi
 * @property {string} [class] - Header class
 * @property {string} [cellClass] - Cell class
 * @property {Function} [format] - Formatlama fonksiyonu
 * @property {Object} [component] - Ozel component
 * @property {boolean} [hidden] - Gizli mi?
 * @property {boolean} [hideOnCard] - Kart gorunumunde gizle
 */

/**
 * @typedef {Object} DropdownOption
 * @property {string|number} value - Secenek degeri
 * @property {string} label - Secenek etiketi
 * @property {string} [icon] - Material icon adi
 * @property {boolean} [disabled] - Devre disi mi?
 */

/**
 * @typedef {Object} ActionMenuItem
 * @property {string} [key] - Unique key
 * @property {string} label - Menu item etiketi
 * @property {string} [icon] - Material icon adi
 * @property {boolean} [danger] - Tehlikeli islem mi?
 * @property {boolean} [disabled] - Devre disi mi?
 * @property {boolean} [divider] - Ayirici cizgi mi?
 * @property {string} [header] - Grup basligi mi?
 * @property {string} [shortcut] - Klavye kisayolu
 * @property {Function} [action] - Click handler
 */

/**
 * @typedef {Object} DateRangePreset
 * @property {string} key - Preset key
 * @property {string} label - Preset etiketi
 * @property {number} days - Gun sayisi
 * @property {number} [offset] - Baslangic offset (gun)
 */

/**
 * @typedef {Object} TabItem
 * @property {string} key - Tab key'i
 * @property {string} label - Tab etiketi
 * @property {string} [icon] - Material icon adi
 * @property {number} [badge] - Badge sayisi
 * @property {boolean} [disabled] - Devre disi mi?
 */

/**
 * @typedef {Object} StepItem
 * @property {string} label - Step etiketi
 * @property {string} [description] - Step aciklamasi
 * @property {string} [icon] - Material icon adi
 * @property {boolean} [disabled] - Devre disi mi?
 * @property {boolean} [error] - Hata var mi?
 */

/**
 * @typedef {Object} TimelineItem
 * @property {string} title - Baslik
 * @property {string} [subtitle] - Alt baslik
 * @property {string} [description] - Aciklama
 * @property {string} [time] - Zaman
 * @property {string} [icon] - Material icon adi
 * @property {string} [color] - Renk (indigo, blue, green, etc.)
 * @property {string[]} [tags] - Etiketler
 * @property {Object[]} [actions] - Aksiyonlar
 */
