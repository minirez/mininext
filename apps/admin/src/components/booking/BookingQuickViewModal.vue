<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-start justify-center p-4 pt-6 overflow-y-auto"
      >
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>

        <!-- Modal -->
        <div
          class="relative w-full max-w-5xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl mb-8"
        >
          <!-- ════════════════════════════════════════════ -->
          <!-- HEADER - Gradient with booking info         -->
          <!-- ════════════════════════════════════════════ -->
          <div class="relative rounded-t-2xl" :class="headerGradient">
            <div class="relative z-10 px-5 py-4">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
                  >
                    <span class="material-icons text-white text-xl">confirmation_number</span>
                  </div>
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <h2 class="text-lg font-bold text-white">
                        {{ bookingDetails?.bookingNumber || booking?.bookingNumber }}
                      </h2>
                      <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-white border border-white/30"
                      >
                        {{ statusLabel }}
                      </span>
                      <span
                        v-if="sourceLabel"
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/15 backdrop-blur-sm text-white/90 border border-white/20"
                      >
                        <span class="material-icons text-xs mr-0.5">{{ sourceIcon }}</span>
                        {{ sourceLabel }}
                      </span>
                    </div>
                    <p class="text-white/70 text-xs mt-0.5">
                      {{ formatDateTime(bookingDetails?.createdAt) }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-1.5">
                  <BookingEmailActions
                    v-if="bookingDetails?._id"
                    :booking-id="bookingDetails._id"
                    :guest-email="bookingDetails.contact?.email"
                    :hotel-email="bookingDetails.hotel?.contact?.email"
                    :guest-language="bookingDetails.guestLanguage || 'tr'"
                    @email-sent="handleEmailSent"
                  />
                  <button
                    class="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    @click="close"
                  >
                    <span class="material-icons text-xl">close</span>
                  </button>
                </div>
              </div>

              <!-- Hotel + Stay Bar -->
              <div
                v-if="bookingDetails"
                class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-white/90 text-sm"
              >
                <!-- Hotel -->
                <div class="flex items-center gap-1.5">
                  <span class="material-icons text-base">hotel</span>
                  <span class="font-medium">{{ bookingDetails.hotelName }}</span>
                </div>
                <!-- Dates -->
                <div class="flex items-center gap-1.5">
                  <span class="material-icons text-base">calendar_today</span>
                  <span>{{ formatDateCompact(bookingDetails.checkIn) }}</span>
                  <span class="material-icons text-xs">arrow_forward</span>
                  <span>{{ formatDateCompact(bookingDetails.checkOut) }}</span>
                  <span class="ml-1 px-1.5 py-0.5 rounded-md bg-white/20 text-xs font-semibold">
                    {{ bookingDetails.nights }} {{ $t('booking.nightsUnit') }}
                  </span>
                </div>
                <!-- Guest counts -->
                <div class="flex items-center gap-2">
                  <span v-if="bookingDetails.totalAdults" class="flex items-center gap-0.5">
                    <span class="material-icons text-base">person</span>
                    {{ bookingDetails.totalAdults }}
                  </span>
                  <span v-if="bookingDetails.totalChildren" class="flex items-center gap-0.5">
                    <span class="material-icons text-base">child_care</span>
                    {{ bookingDetails.totalChildren }}
                  </span>
                  <span v-if="bookingDetails.totalRooms > 1" class="flex items-center gap-0.5">
                    <span class="material-icons text-base">king_bed</span>
                    {{ bookingDetails.totalRooms }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="flex items-center justify-center py-20">
            <div
              class="animate-spin rounded-full h-8 w-8 border-[3px] border-purple-500 border-t-transparent"
            ></div>
          </div>

          <!-- ════════════════════════════════════════════ -->
          <!-- CONTENT                                     -->
          <!-- ════════════════════════════════════════════ -->
          <div v-else-if="bookingDetails" class="p-5 max-h-[calc(100vh-240px)] overflow-y-auto">
            <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">
              <!-- ═══════════ LEFT COLUMN (3/5) ═══════════ -->
              <div class="lg:col-span-3 space-y-4">
                <!-- Guest Card -->
                <div
                  class="bg-white dark:bg-slate-700/40 rounded-xl border border-gray-100 dark:border-slate-700 p-4"
                >
                  <div class="flex items-center justify-between mb-3">
                    <h3
                      class="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <span class="material-icons text-sm">person</span>
                      {{ $t('booking.guest') }}
                    </h3>
                    <button
                      v-if="canEdit"
                      class="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-0.5 transition-colors"
                      @click="toggleGuestEdit"
                    >
                      <span class="material-icons text-sm">{{
                        isEditingGuest ? 'close' : 'edit'
                      }}</span>
                      {{ isEditingGuest ? $t('common.cancel') : $t('booking.email.edit') }}
                    </button>
                  </div>

                  <!-- View Mode -->
                  <div v-if="!isEditingGuest">
                    <div v-if="bookingDetails.leadGuest" class="flex items-start gap-3">
                      <!-- Avatar -->
                      <div
                        class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0"
                      >
                        {{ initials }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="font-semibold text-gray-900 dark:text-white">
                          {{ bookingDetails.leadGuest.firstName }}
                          {{ bookingDetails.leadGuest.lastName }}
                        </p>
                        <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                          <span
                            v-if="bookingDetails.contact?.email"
                            class="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-1 truncate"
                          >
                            <span class="material-icons text-xs">email</span>
                            {{ bookingDetails.contact.email }}
                          </span>
                          <span
                            v-if="bookingDetails.contact?.phone"
                            class="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-1"
                          >
                            <span class="material-icons text-xs">phone</span>
                            {{ bookingDetails.contact.phone }}
                          </span>
                          <span
                            v-if="bookingDetails.leadGuest.nationality"
                            class="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-1"
                          >
                            <span class="material-icons text-xs">flag</span>
                            {{ bookingDetails.leadGuest.nationality }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p v-else class="text-gray-400 dark:text-slate-500 italic text-sm">
                      {{ $t('booking.noGuestInfo') }}
                    </p>
                  </div>

                  <!-- Edit Mode -->
                  <div v-else class="space-y-2.5">
                    <div class="grid grid-cols-2 gap-2">
                      <input
                        v-model="editForm.leadGuest.firstName"
                        type="text"
                        class="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        :placeholder="$t('booking.firstName')"
                      />
                      <input
                        v-model="editForm.leadGuest.lastName"
                        type="text"
                        class="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        :placeholder="$t('booking.lastName')"
                      />
                    </div>
                    <input
                      v-model="editForm.contact.email"
                      type="email"
                      class="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      :placeholder="$t('common.email')"
                    />
                    <div class="flex gap-2">
                      <input
                        v-model="editForm.contact.phone"
                        type="tel"
                        class="flex-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        :placeholder="$t('booking.phone')"
                      />
                      <select
                        v-model="editForm.guestLanguage"
                        class="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                      >
                        <option value="tr">TR</option>
                        <option value="en">EN</option>
                        <option value="ru">RU</option>
                        <option value="de">DE</option>
                      </select>
                    </div>
                    <button
                      class="w-full btn-primary px-3 py-1.5 text-sm rounded-lg"
                      :disabled="savingGuest"
                      @click="saveGuestInfo"
                    >
                      {{ savingGuest ? $t('common.saving') : $t('booking.email.saveChanges') }}
                    </button>
                  </div>
                </div>

                <!-- Rooms -->
                <div
                  class="bg-white dark:bg-slate-700/40 rounded-xl border border-gray-100 dark:border-slate-700 p-4"
                >
                  <h3
                    class="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3"
                  >
                    <span class="material-icons text-sm">king_bed</span>
                    {{ $t('booking.rooms') }}
                    <span
                      v-if="bookingDetails.totalRooms > 1"
                      class="ml-1 px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-slate-300 text-xs font-medium normal-case"
                    >
                      {{ bookingDetails.totalRooms }} {{ $t('booking.roomUnit') }}
                    </span>
                  </h3>

                  <div class="space-y-2.5">
                    <div
                      v-for="(room, idx) in bookingDetails.rooms"
                      :key="idx"
                      class="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700"
                    >
                      <div class="flex items-start justify-between gap-3">
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2 flex-wrap">
                            <p class="font-semibold text-sm text-gray-900 dark:text-white">
                              {{ getLocalizedName(room.roomTypeName) }}
                            </p>
                            <!-- Rate type badge -->
                            <span
                              v-if="room.rateType === 'non_refundable'"
                              class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                            >
                              {{ $t('booking.nonRefundable') }}
                            </span>
                            <span
                              v-else-if="room.rateType === 'refundable'"
                              class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            >
                              {{ $t('booking.refundable') }}
                            </span>
                          </div>
                          <div class="flex items-center gap-3 mt-1">
                            <span
                              class="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1"
                            >
                              <span class="material-icons" style="font-size: 12px">restaurant</span>
                              {{ getLocalizedName(room.mealPlanName) }}
                            </span>
                            <!-- Guest count per room -->
                            <span
                              v-if="room.guests?.length"
                              class="text-xs text-gray-400 dark:text-slate-500"
                            >
                              {{ room.guests.filter(g => g.type === 'adult').length }}
                              {{ $t('booking.adult') }}
                              <template v-if="room.guests.filter(g => g.type === 'child').length">
                                + {{ room.guests.filter(g => g.type === 'child').length }}
                                {{ $t('booking.children') }}
                              </template>
                            </span>
                          </div>
                          <!-- Per-room guests list -->
                          <div v-if="room.guests?.length > 1" class="mt-2 flex flex-wrap gap-1.5">
                            <span
                              v-for="(g, gi) in room.guests"
                              :key="gi"
                              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300"
                            >
                              {{ g.firstName }} {{ g.lastName }}
                              <span v-if="g.type === 'child'" class="ml-1 text-orange-500"
                                >({{ $t('booking.children') }})</span
                              >
                            </span>
                          </div>
                          <!-- Cancellation policy -->
                          <div
                            v-if="room.cancellationPolicy"
                            class="mt-2 text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1"
                          >
                            <span class="material-icons" style="font-size: 12px">policy</span>
                            <span
                              v-if="
                                room.cancellationPolicy.isRefundable &&
                                room.cancellationPolicy.freeCancellation?.enabled
                              "
                              class="text-green-600 dark:text-green-400"
                            >
                              {{ $t('booking.paximum.freeCancellation') }}
                              ({{ room.cancellationPolicy.freeCancellation.daysBeforeCheckIn }}d)
                            </span>
                            <span
                              v-else-if="!room.cancellationPolicy.isRefundable"
                              class="text-red-500"
                            >
                              {{ $t('booking.paximum.nonRefundable') }}
                            </span>
                          </div>
                        </div>
                        <!-- Room price -->
                        <div class="text-right shrink-0">
                          <span class="text-sm font-bold text-gray-900 dark:text-white">
                            {{
                              formatPrice(
                                room.pricing?.finalTotal,
                                bookingDetails.pricing?.currency
                              )
                            }}
                          </span>
                          <p
                            v-if="room.pricing?.avgPerNight && bookingDetails.nights > 1"
                            class="text-xs text-gray-400 dark:text-slate-500"
                          >
                            {{
                              formatPrice(
                                room.pricing.avgPerNight,
                                bookingDetails.pricing?.currency
                              )
                            }}/{{ $t('booking.nightsUnit') }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Special Requests -->
                <div
                  v-if="bookingDetails.specialRequests"
                  class="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800/50 p-4"
                >
                  <h3
                    class="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-2"
                  >
                    <span class="material-icons text-sm">sticky_note_2</span>
                    {{ $t('booking.specialRequests') }}
                  </h3>
                  <p class="text-sm text-amber-800 dark:text-amber-200 whitespace-pre-line">
                    {{ bookingDetails.specialRequests }}
                  </p>
                </div>

                <!-- Internal Notes (latest) -->
                <div
                  v-if="bookingDetails.notes?.length"
                  class="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800/50 p-4"
                >
                  <h3
                    class="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5 mb-2"
                  >
                    <span class="material-icons text-sm">notes</span>
                    {{ $t('booking.internalNotes') }}
                    <span class="normal-case font-normal">({{ bookingDetails.notes.length }})</span>
                  </h3>
                  <div class="space-y-2">
                    <div
                      v-for="(note, ni) in bookingDetails.notes.slice(0, 2)"
                      :key="ni"
                      class="text-sm text-blue-800 dark:text-blue-200"
                    >
                      <p class="whitespace-pre-line">{{ note.content }}</p>
                      <p class="text-xs text-blue-500 dark:text-blue-400 mt-0.5">
                        {{ formatDateTime(note.createdAt) }}
                      </p>
                    </div>
                    <p
                      v-if="bookingDetails.notes.length > 2"
                      class="text-xs text-blue-500 dark:text-blue-400"
                    >
                      +{{ bookingDetails.notes.length - 2 }} ...
                    </p>
                  </div>
                </div>
              </div>

              <!-- ═══════════ RIGHT COLUMN (2/5) ═══════════ -->
              <div class="lg:col-span-2 space-y-4">
                <!-- Financial Summary -->
                <div
                  class="bg-white dark:bg-slate-700/40 rounded-xl border border-gray-100 dark:border-slate-700 p-4"
                >
                  <h3
                    class="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3"
                  >
                    <span class="material-icons text-sm">payments</span>
                    {{ $t('booking.pricing') }}
                  </h3>

                  <div class="space-y-2">
                    <!-- Subtotal -->
                    <div
                      v-if="bookingDetails.pricing?.totalDiscount"
                      class="flex justify-between items-center text-sm"
                    >
                      <span class="text-gray-500 dark:text-slate-400">{{
                        $t('booking.subtotal')
                      }}</span>
                      <span class="text-gray-700 dark:text-slate-300">
                        {{
                          formatPrice(
                            bookingDetails.pricing.subtotal,
                            bookingDetails.pricing.currency
                          )
                        }}
                      </span>
                    </div>

                    <!-- Discount -->
                    <div
                      v-if="bookingDetails.pricing?.totalDiscount"
                      class="flex justify-between items-center text-sm"
                    >
                      <span class="text-green-600 dark:text-green-400 flex items-center gap-1">
                        <span class="material-icons" style="font-size: 14px">sell</span>
                        {{ $t('booking.discount') }}
                      </span>
                      <span class="text-green-600 dark:text-green-400 font-medium">
                        -{{
                          formatPrice(
                            bookingDetails.pricing.totalDiscount,
                            bookingDetails.pricing.currency
                          )
                        }}
                      </span>
                    </div>

                    <!-- Cancellation Guarantee -->
                    <div
                      v-if="bookingDetails.cancellationGuarantee?.purchased"
                      class="flex justify-between items-center text-sm"
                    >
                      <span class="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <span class="material-icons" style="font-size: 14px">verified_user</span>
                        {{ $t('booking.cancellationGuarantee') }}
                        ({{ bookingDetails.cancellationGuarantee.rate }}%)
                      </span>
                      <span class="text-blue-600 dark:text-blue-400 font-medium">
                        +{{
                          formatPrice(
                            bookingDetails.cancellationGuarantee.amount,
                            bookingDetails.pricing.currency
                          )
                        }}
                      </span>
                    </div>

                    <!-- Commission (B2B) -->
                    <div
                      v-if="bookingDetails.pricing?.commission"
                      class="flex justify-between items-center text-sm"
                    >
                      <span class="text-gray-500 dark:text-slate-400 flex items-center gap-1">
                        <span class="material-icons" style="font-size: 14px">percent</span>
                        {{ $t('booking.cost') }}
                        <span v-if="bookingDetails.pricing.commissionRate" class="text-xs"
                          >({{ bookingDetails.pricing.commissionRate }}%)</span
                        >
                      </span>
                      <span class="text-gray-600 dark:text-slate-300">
                        {{
                          formatPrice(
                            bookingDetails.pricing.netPrice,
                            bookingDetails.pricing.currency
                          )
                        }}
                      </span>
                    </div>

                    <!-- Total -->
                    <div
                      class="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-slate-600"
                    >
                      <span class="text-sm font-semibold text-gray-700 dark:text-slate-200">{{
                        $t('payment.total')
                      }}</span>
                      <span class="text-xl font-bold text-gray-900 dark:text-white">
                        {{
                          formatPrice(
                            bookingDetails.pricing?.grandTotal,
                            bookingDetails.pricing?.currency
                          )
                        }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Payment Status Card -->
                <div class="rounded-xl border p-4" :class="paymentCardClass">
                  <div class="flex items-center justify-between mb-2">
                    <h3
                      class="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
                      :class="paymentLabelClass"
                    >
                      <span class="material-icons text-sm">{{ paymentIcon }}</span>
                      {{ $t('payment.title') }}
                    </h3>
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                      :class="paymentStatusBadge"
                    >
                      {{ paymentStatusLabel }}
                    </span>
                  </div>

                  <!-- Payment method -->
                  <div class="flex items-center justify-between text-sm mb-1">
                    <span class="text-gray-500 dark:text-slate-400 flex items-center gap-1">
                      <span class="material-icons" style="font-size: 14px">{{
                        paymentMethodIcon
                      }}</span>
                      {{ paymentMethodLabel }}
                    </span>
                  </div>

                  <!-- Paid / Remaining -->
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-500 dark:text-slate-400">{{ $t('payment.paid') }}</span>
                    <span class="font-semibold text-green-600 dark:text-green-400">
                      {{
                        formatPrice(
                          bookingDetails.payment?.paidAmount || 0,
                          bookingDetails.pricing?.currency
                        )
                      }}
                    </span>
                  </div>
                  <div
                    v-if="remainingAmount > 0"
                    class="flex items-center justify-between text-sm mt-1"
                  >
                    <span class="text-gray-500 dark:text-slate-400">{{
                      $t('payment.remaining')
                    }}</span>
                    <span class="font-semibold text-orange-500">
                      {{ formatPrice(remainingAmount, bookingDetails.pricing?.currency) }}
                    </span>
                  </div>
                </div>

                <!-- Timeline -->
                <div
                  class="bg-white dark:bg-slate-700/40 rounded-xl border border-gray-100 dark:border-slate-700 p-4"
                >
                  <h3
                    class="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-3"
                  >
                    <span class="material-icons text-sm">timeline</span>
                    {{ $t('booking.detail.timeline') }}
                  </h3>

                  <div class="relative pl-5 space-y-3">
                    <!-- Vertical line -->
                    <div
                      class="absolute left-[7px] top-1 bottom-1 w-0.5 bg-gray-200 dark:bg-slate-600"
                    ></div>

                    <!-- Created -->
                    <div class="relative flex items-start gap-2.5">
                      <div
                        class="absolute -left-5 w-3.5 h-3.5 rounded-full bg-purple-500 border-2 border-white dark:border-slate-800 z-10"
                      ></div>
                      <div>
                        <p class="text-xs font-medium text-gray-700 dark:text-slate-300">
                          {{ $t('booking.detail.createdAt') }}
                        </p>
                        <p class="text-xs text-gray-400 dark:text-slate-500">
                          {{ formatDateTime(bookingDetails.createdAt) }}
                        </p>
                      </div>
                    </div>

                    <!-- Confirmed -->
                    <div
                      v-if="bookingDetails.confirmedAt"
                      class="relative flex items-start gap-2.5"
                    >
                      <div
                        class="absolute -left-5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white dark:border-slate-800 z-10"
                      ></div>
                      <div>
                        <p class="text-xs font-medium text-gray-700 dark:text-slate-300">
                          {{ $t('booking.statusConfirmed') }}
                        </p>
                        <p class="text-xs text-gray-400 dark:text-slate-500">
                          {{ formatDateTime(bookingDetails.confirmedAt) }}
                        </p>
                      </div>
                    </div>

                    <!-- Completed -->
                    <div
                      v-if="bookingDetails.completedAt"
                      class="relative flex items-start gap-2.5"
                    >
                      <div
                        class="absolute -left-5 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white dark:border-slate-800 z-10"
                      ></div>
                      <div>
                        <p class="text-xs font-medium text-gray-700 dark:text-slate-300">
                          {{ $t('booking.statuses.completed') }}
                        </p>
                        <p class="text-xs text-gray-400 dark:text-slate-500">
                          {{ formatDateTime(bookingDetails.completedAt) }}
                        </p>
                      </div>
                    </div>

                    <!-- Cancelled -->
                    <div
                      v-if="bookingDetails.cancellation?.cancelledAt"
                      class="relative flex items-start gap-2.5"
                    >
                      <div
                        class="absolute -left-5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white dark:border-slate-800 z-10"
                      ></div>
                      <div>
                        <p class="text-xs font-medium text-red-600 dark:text-red-400">
                          {{ $t('booking.statusCancelled') }}
                        </p>
                        <p class="text-xs text-gray-400 dark:text-slate-500">
                          {{ formatDateTime(bookingDetails.cancellation.cancelledAt) }}
                        </p>
                        <p
                          v-if="bookingDetails.cancellation.reason"
                          class="text-xs text-red-500 dark:text-red-400 mt-0.5 italic"
                        >
                          "{{ bookingDetails.cancellation.reason }}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Market & Source Info -->
                <div
                  v-if="bookingDetails.marketName || bookingDetails.salesChannel === 'b2b'"
                  class="bg-white dark:bg-slate-700/40 rounded-xl border border-gray-100 dark:border-slate-700 p-4"
                >
                  <h3
                    class="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2"
                  >
                    <span class="material-icons text-sm">info</span>
                    {{ $t('booking.source') }}
                  </h3>
                  <div class="space-y-1.5 text-sm">
                    <div v-if="bookingDetails.marketName" class="flex justify-between">
                      <span class="text-gray-500 dark:text-slate-400">{{
                        $t('booking.market')
                      }}</span>
                      <span class="text-gray-700 dark:text-slate-300 font-medium">
                        {{ getLocalizedName(bookingDetails.marketName) }}
                        <span v-if="bookingDetails.marketCode" class="text-xs text-gray-400"
                          >({{ bookingDetails.marketCode }})</span
                        >
                      </span>
                    </div>
                    <div v-if="bookingDetails.salesChannel" class="flex justify-between">
                      <span class="text-gray-500 dark:text-slate-400">{{
                        $t('booking.channel')
                      }}</span>
                      <span
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        :class="
                          bookingDetails.salesChannel === 'b2b'
                            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                            : 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                        "
                      >
                        {{ bookingDetails.salesChannel.toUpperCase() }}
                      </span>
                    </div>
                    <div v-if="bookingDetails.source?.agencyName" class="flex justify-between">
                      <span class="text-gray-500 dark:text-slate-400">Acenta</span>
                      <span class="text-gray-700 dark:text-slate-300">{{
                        bookingDetails.source.agencyName
                      }}</span>
                    </div>
                    <div v-if="bookingDetails.seasonName" class="flex justify-between">
                      <span class="text-gray-500 dark:text-slate-400">{{
                        $t('booking.season')
                      }}</span>
                      <span class="text-gray-700 dark:text-slate-300">{{
                        getLocalizedName(bookingDetails.seasonName)
                      }}</span>
                    </div>
                  </div>
                </div>

                <!-- Billing / Invoice Info -->
                <div
                  v-if="bookingDetails.billing?.companyName || bookingDetails.invoiceDetails"
                  class="bg-white dark:bg-slate-700/40 rounded-xl border border-gray-100 dark:border-slate-700 p-4"
                >
                  <h3
                    class="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2"
                  >
                    <span class="material-icons text-sm">receipt_long</span>
                    {{ $t('booking.invoiceDetails.title') }}
                  </h3>
                  <div class="text-sm space-y-1">
                    <p
                      v-if="bookingDetails.billing?.companyName"
                      class="font-medium text-gray-900 dark:text-white"
                    >
                      {{ bookingDetails.billing.companyName }}
                    </p>
                    <p
                      v-if="bookingDetails.billing?.taxNumber"
                      class="text-gray-500 dark:text-slate-400"
                    >
                      VKN: {{ bookingDetails.billing.taxNumber }}
                      <span v-if="bookingDetails.billing?.taxOffice">
                        / {{ bookingDetails.billing.taxOffice }}</span
                      >
                    </p>
                    <p
                      v-if="bookingDetails.billing?.address"
                      class="text-gray-500 dark:text-slate-400"
                    >
                      {{ bookingDetails.billing.address }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ════════════════════════════════════════════ -->
          <!-- FOOTER                                      -->
          <!-- ════════════════════════════════════════════ -->
          <div
            class="flex items-center justify-between px-5 py-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 rounded-b-2xl"
          >
            <button
              class="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              @click="close"
            >
              {{ $t('common.close') }}
            </button>
            <div class="flex items-center gap-2">
              <button
                v-if="canAmend"
                class="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors flex items-center gap-1.5"
                @click="$emit('amend', bookingDetails)"
              >
                <span class="material-icons text-base">edit</span>
                {{ $t('booking.amend') }}
              </button>
              <button
                class="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                @click="goToDetail"
              >
                <span class="material-icons text-base">open_in_new</span>
                {{ $t('booking.viewFullDetails') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useStatusHelpers } from '@/composables/useStatusHelpers'
import { useToast } from '@/composables/useToast'
import { formatPrice } from '@/utils/formatters'
import bookingService from '@/services/bookingService'
import BookingEmailActions from './BookingEmailActions.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  booking: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'amend', 'close', 'updated'])

const { locale, t } = useI18n()
const router = useRouter()
const { getBookingStatusLabel } = useStatusHelpers()
const { success: showSuccess, error: showError } = useToast()

// State
const loading = ref(false)
const bookingDetails = ref(null)
const isEditingGuest = ref(false)
const savingGuest = ref(false)

const editForm = reactive({
  leadGuest: { firstName: '', lastName: '' },
  contact: { email: '', phone: '' },
  guestLanguage: 'tr'
})

// ═══════════════════════════════════════
// Computed
// ═══════════════════════════════════════

const statusLabel = computed(() => {
  if (!bookingDetails.value) return ''
  return getBookingStatusLabel(bookingDetails.value.status)
})

const headerGradient = computed(() => {
  const s = bookingDetails.value?.status || booking?.status
  const map = {
    confirmed: 'bg-gradient-to-r from-emerald-600 to-teal-600',
    completed: 'bg-gradient-to-r from-blue-600 to-indigo-600',
    cancelled: 'bg-gradient-to-r from-red-600 to-rose-700',
    no_show: 'bg-gradient-to-r from-gray-600 to-gray-700',
    pending: 'bg-gradient-to-r from-amber-600 to-orange-600',
    checked_in: 'bg-gradient-to-r from-cyan-600 to-blue-600',
    draft: 'bg-gradient-to-r from-gray-500 to-slate-600',
    expired: 'bg-gradient-to-r from-gray-500 to-gray-600'
  }
  return map[s] || 'bg-gradient-to-r from-purple-600 to-indigo-600'
})

const initials = computed(() => {
  const g = bookingDetails.value?.leadGuest
  if (!g) return '?'
  return ((g.firstName?.[0] || '') + (g.lastName?.[0] || '')).toUpperCase() || '?'
})

const sourceLabel = computed(() => {
  const src = bookingDetails.value?.source
  if (!src?.type || src.type === 'b2c') return ''
  const map = {
    b2b: 'B2B',
    admin: 'Admin',
    api: 'API',
    migration: 'Migration',
    paximum: 'Bedbank',
    pms: 'PMS',
    channel: 'Channel'
  }
  return map[src.type] || src.type
})

const sourceIcon = computed(() => {
  const map = {
    b2b: 'business',
    admin: 'admin_panel_settings',
    api: 'api',
    migration: 'swap_horiz',
    paximum: 'cloud',
    pms: 'computer',
    channel: 'share'
  }
  return map[bookingDetails.value?.source?.type] || 'language'
})

const remainingAmount = computed(() => {
  if (!bookingDetails.value?.pricing?.grandTotal) return 0
  return Math.max(
    0,
    bookingDetails.value.pricing.grandTotal - (bookingDetails.value.payment?.paidAmount || 0)
  )
})

const canAmend = computed(() => {
  if (!bookingDetails.value) return false
  return ['pending', 'confirmed', 'checked_in'].includes(bookingDetails.value.status)
})

const canEdit = computed(() => {
  if (!bookingDetails.value) return false
  return !['cancelled', 'completed', 'no_show'].includes(bookingDetails.value.status)
})

// Payment card styling
const paymentCardClass = computed(() => {
  const ps = bookingDetails.value?.payment?.status
  if (ps === 'paid')
    return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50'
  if (ps === 'partial')
    return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50'
  if (ps === 'refunded')
    return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50'
  if (ps === 'failed') return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50'
  return 'bg-gray-50 dark:bg-slate-700/40 border-gray-200 dark:border-slate-700'
})

const paymentLabelClass = computed(() => {
  const ps = bookingDetails.value?.payment?.status
  if (ps === 'paid') return 'text-green-600 dark:text-green-400'
  if (ps === 'partial') return 'text-amber-600 dark:text-amber-400'
  return 'text-gray-400 dark:text-slate-500'
})

const paymentIcon = computed(() => {
  const ps = bookingDetails.value?.payment?.status
  if (ps === 'paid') return 'check_circle'
  if (ps === 'partial') return 'pending'
  if (ps === 'refunded') return 'replay'
  if (ps === 'failed') return 'error'
  return 'schedule'
})

const paymentStatusBadge = computed(() => {
  const ps = bookingDetails.value?.payment?.status
  if (ps === 'paid') return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
  if (ps === 'partial')
    return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
  if (ps === 'refunded') return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
  if (ps === 'failed') return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
  return 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
})

const paymentStatusLabel = computed(() => {
  const ps = bookingDetails.value?.payment?.status
  return ps ? t(`payment.status.${ps}`) : '-'
})

const paymentMethodIcon = computed(() => {
  const m = bookingDetails.value?.payment?.method
  const map = {
    credit_card: 'credit_card',
    bank_transfer: 'account_balance',
    cash: 'money',
    agency_credit: 'account_balance_wallet',
    pay_at_checkin: 'login',
    online: 'language'
  }
  return map[m] || 'payment'
})

const paymentMethodLabel = computed(() => {
  const m = bookingDetails.value?.payment?.method
  return m ? t(`payment.type.${m}`) : '-'
})

// ═══════════════════════════════════════
// Methods
// ═══════════════════════════════════════

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

const goToDetail = () => {
  if (bookingDetails.value) {
    router.push(`/bookings/${bookingDetails.value._id}`)
  }
}

const formatDateCompact = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short'
  })
}

const formatDateTime = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getLocalizedName = name => {
  if (!name) return ''
  if (typeof name === 'object')
    return name[locale.value] || name.en || name.tr || Object.values(name)[0] || ''
  return name
}

const toggleGuestEdit = () => {
  if (isEditingGuest.value) {
    isEditingGuest.value = false
  } else {
    editForm.leadGuest.firstName = bookingDetails.value?.leadGuest?.firstName || ''
    editForm.leadGuest.lastName = bookingDetails.value?.leadGuest?.lastName || ''
    editForm.contact.email = bookingDetails.value?.contact?.email || ''
    editForm.contact.phone = bookingDetails.value?.contact?.phone || ''
    editForm.guestLanguage = bookingDetails.value?.guestLanguage || 'tr'
    isEditingGuest.value = true
  }
}

const saveGuestInfo = async () => {
  if (!bookingDetails.value?._id) return
  savingGuest.value = true
  try {
    const response = await bookingService.updateGuestInfo(bookingDetails.value._id, {
      leadGuest: editForm.leadGuest,
      contact: editForm.contact,
      guestLanguage: editForm.guestLanguage
    })
    if (response.success) {
      showSuccess(t('booking.email.guestUpdated'))
      if (response.data.booking) bookingDetails.value = response.data.booking
      isEditingGuest.value = false
      emit('updated', bookingDetails.value)
    } else {
      showError(response.message || t('booking.email.updateError'))
    }
  } catch (err) {
    showError(err.message || t('booking.email.updateError'))
  } finally {
    savingGuest.value = false
  }
}

const handleEmailSent = () => {
  showSuccess(t('booking.email.sent'))
}

const loadBookingDetails = async () => {
  if (!props.booking?._id) return
  loading.value = true
  try {
    const response = await bookingService.getBooking(props.booking._id)
    if (response.success) bookingDetails.value = response.data
  } catch {
    bookingDetails.value = props.booking
  } finally {
    loading.value = false
  }
}

// Watch for modal open
watch(
  () => props.modelValue,
  isOpen => {
    if (isOpen && props.booking) {
      isEditingGuest.value = false
      bookingDetails.value = props.booking
      loadBookingDetails()
    } else {
      bookingDetails.value = null
      isEditingGuest.value = false
    }
  }
)
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.96) translateY(-10px);
}
</style>
