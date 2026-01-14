# Issue Management İyileştirme Planı

## 📋 İstenen Özellikler

1. **Clipboard Paste Desteği** - Win+Shift+S ile alınan ekran görüntülerini Ctrl+V ile yapıştırma
2. **@mention Sistemi** - Backend var, frontend tarafı eksik
3. **Manuel Dürtme (Nudge)** - Email/SMS ile bilgilendirme

---

## 🔧 Özellik 1: Clipboard Paste Desteği

### Mevcut Durum
- Dosya yükleme: Drag-drop veya click-to-select
- Clipboard desteği yok

### Yapılacaklar

#### Frontend Değişiklikleri

**1. IssueCreateModal.vue** - Modal genelinde paste listener
```javascript
// Modal açıkken document'a paste event listener ekle
onMounted(() => {
  document.addEventListener('paste', handlePaste)
})

onUnmounted(() => {
  document.removeEventListener('paste', handlePaste)
})

const handlePaste = async (e) => {
  const items = e.clipboardData?.items
  if (!items) return

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault()
      const file = item.getAsFile()
      if (file) {
        // Dosya adı oluştur: screenshot-2024-01-14-143052.png
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
        const namedFile = new File([file], `screenshot-${timestamp}.png`, { type: file.type })
        addFileToList(namedFile)
      }
    }
  }
}
```

**2. IssueDetailView.vue** - Yorum yazarken ve genel sayfa için
- Aynı paste logic
- Yapıştırılan görsel otomatik upload edilip comment'e eklenir

**3. Visual Feedback**
- Paste yapıldığında toast: "Ekran görüntüsü eklendi"
- Upload zone'da "veya Ctrl+V ile yapıştır" hint text

### Dosyalar
- `apps/admin/src/components/issues/IssueCreateModal.vue`
- `apps/admin/src/views/IssueDetailView.vue`

---

## 🔧 Özellik 2: @Mention Sistemi

### Mevcut Durum
- **Backend**: Tam destek var ✅
  - `comment.mentions` array'i
  - `sendIssueNotification()` mention'lar için çağrılıyor
- **Frontend**: Sadece placeholder text var ❌

### Yapılacaklar

#### Frontend Bileşeni: MentionInput.vue

**Yeni component oluştur:**
```vue
<template>
  <div class="mention-input-wrapper">
    <textarea
      ref="textareaRef"
      v-model="localContent"
      @input="handleInput"
      @keydown="handleKeydown"
    />

    <!-- Autocomplete dropdown -->
    <div v-if="showSuggestions" class="mention-dropdown">
      <div
        v-for="(user, index) in filteredUsers"
        :key="user._id"
        :class="{ 'selected': index === selectedIndex }"
        @click="selectUser(user)"
      >
        <Avatar :src="user.avatar" size="sm" />
        <span>{{ user.name }}</span>
        <span class="email">{{ user.email }}</span>
      </div>
    </div>
  </div>
</template>
```

**Özellikler:**
1. `@` yazıldığında autocomplete açılır
2. Platform kullanıcıları listelenir (getPlatformUsers API mevcut)
3. Yukarı/aşağı ok ile seçim, Enter ile onay
4. Seçilen kullanıcı `@username` formatında eklenir
5. `mentions` array'i emit edilir (user ID'leri)

#### Yorum Görüntülemede Highlight

**Comment content render:**
```javascript
const renderCommentWithMentions = (content, mentions) => {
  // @username pattern'larını bulup <span class="mention">@username</span> yap
  return content.replace(/@(\w+)/g, (match, username) => {
    return `<span class="mention">${match}</span>`
  })
}
```

### Dosyalar
- `apps/admin/src/components/issues/MentionInput.vue` (YENİ)
- `apps/admin/src/views/IssueDetailView.vue` (comment form güncelle)
- `apps/admin/src/components/issues/IssueCreateModal.vue` (description için)

---

## 🔧 Özellik 3: Manuel Dürtme (Nudge) Sistemi

### Amaç
- Assignee'yi veya watcher'ları manuel olarak bilgilendirme
- "Hey, bu issue'ya bak" tarzı hatırlatma
- Email ve/veya SMS ile

### Yapılacaklar

#### Backend

**1. Yeni endpoint:**
```javascript
// POST /api/issues/:id/nudge
router.post('/:id/nudge', protect, requirePlatformUser, nudgeIssue)
```

**2. Service fonksiyonu:**
```javascript
export const nudgeIssue = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { recipients, message, channels } = req.body
  // recipients: ['userId1', 'userId2'] veya 'assignee' | 'watchers' | 'all'
  // channels: ['notification', 'email', 'sms']

  const issue = await Issue.findById(id)

  // Alıcıları belirle
  let targetUsers = []
  if (recipients === 'assignee' && issue.assignee) {
    targetUsers = [issue.assignee]
  } else if (recipients === 'watchers') {
    targetUsers = issue.watchers
  } else if (recipients === 'all') {
    targetUsers = [issue.assignee, ...issue.watchers].filter(Boolean)
  } else if (Array.isArray(recipients)) {
    targetUsers = recipients
  }

  // Her kanal için gönder
  for (const userId of targetUsers) {
    const user = await User.findById(userId)

    if (channels.includes('notification')) {
      await sendIssueNotification(userId, 'issue_nudge', ...)
    }

    if (channels.includes('email') && user.email) {
      await sendIssueNudgeEmail({ to: user.email, issue, message, sender: req.user })
    }

    if (channels.includes('sms') && user.phone) {
      await sendSms({ to: user.phone, message: `[${issue.issueNumber}] ${message}` })
    }
  }

  // Activity log
  issue.addActivity('nudge_sent', req.user._id, { recipients: targetUsers.length, channels })
  await issue.save()
})
```

**3. Email template:**
- `packages/emails/templates/issue-nudge.html` (Maizzle)
- Modern, responsive tasarım
- Issue bilgileri + custom message + CTA button

#### Frontend

**1. IssueDetailView'da Nudge butonu:**
```vue
<button @click="showNudgeModal = true" class="btn-nudge">
  <span class="material-icons">notifications_active</span>
  Dürt
</button>
```

**2. NudgeModal.vue:**
```vue
<template>
  <Modal v-model="show">
    <h3>Bildirim Gönder</h3>

    <!-- Alıcı seçimi -->
    <div class="recipients">
      <label>
        <input type="radio" v-model="recipients" value="assignee" />
        Atanan kişi ({{ assigneeName }})
      </label>
      <label>
        <input type="radio" v-model="recipients" value="watchers" />
        Takipçiler ({{ watchersCount }} kişi)
      </label>
      <label>
        <input type="radio" v-model="recipients" value="all" />
        Tümü
      </label>
    </div>

    <!-- Kanallar -->
    <div class="channels">
      <label>
        <input type="checkbox" v-model="channels" value="notification" checked disabled />
        Uygulama bildirimi
      </label>
      <label>
        <input type="checkbox" v-model="channels" value="email" />
        E-posta
      </label>
      <label>
        <input type="checkbox" v-model="channels" value="sms" />
        SMS
      </label>
    </div>

    <!-- Mesaj -->
    <textarea v-model="message" placeholder="İsteğe bağlı mesaj..." />

    <button @click="sendNudge">Gönder</button>
  </Modal>
</template>
```

### Dosyalar
- `apps/api/src/modules/issue/issue.service.js` (nudgeIssue fonksiyonu)
- `apps/api/src/modules/issue/issue.routes.js` (endpoint)
- `apps/api/src/helpers/mail.js` (sendIssueNudgeEmail)
- `packages/emails/templates/issue-nudge.html` (email template)
- `apps/admin/src/components/issues/NudgeModal.vue` (YENİ)
- `apps/admin/src/views/IssueDetailView.vue` (nudge butonu)
- `apps/admin/src/services/issueService.js` (nudgeIssue API call)

---

## 📊 Özet

| Özellik | Zorluk | Tahmini Dosya Sayısı |
|---------|--------|----------------------|
| Clipboard Paste | Kolay | 2 dosya |
| @Mention Sistemi | Orta | 3-4 dosya |
| Nudge Sistemi | Orta-Zor | 6-7 dosya |

### Uygulama Sırası (Önerilen)

1. **Clipboard Paste** - En hızlı, hemen kullanılabilir
2. **@Mention** - Backend hazır, frontend ekleme
3. **Nudge** - Yeni API + email template + frontend

---

## 🎯 Onay Bekleyen Sorular

1. **Nudge limiti**: Aynı issue için günlük nudge limiti olsun mu? (spam önleme)
2. **SMS**: SMS maliyeti var, sadece email mi olsun yoksa SMS de dahil mi?
3. **@Mention**: Sadece platform kullanıcıları mı, yoksa tüm kullanıcılar mı mention edilebilsin?
