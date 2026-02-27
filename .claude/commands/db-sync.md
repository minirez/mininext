# DB Sync - Production'dan Lokal'e Veritabanı Senkronizasyonu

Production sunucudan MongoDB dump alıp lokal ortama restore eden skill.

## Bilgiler

- **Production Sunucu:** root@85.31.238.34 (Docker)
- **Production DB:** Docker container `minirez-mongodb` içinde
- **Lokal DB:** mongodb://localhost:27017/booking-engine
- **SSH Şifresi:** CwQGE8NDAUU6eaH9siDg
- **Dump Dizini (sunucu):** /tmp/db-dump
- **Dump Dizini (lokal):** /tmp/db-dump

## Adımlar

### 1. Kullanıcıya Sor

Başlamadan önce kullanıcıya şunları sor:

- Tüm veritabanını mı yoksa belirli collection'ları mı senkronize etmek istiyor?
- Eğer belirli collection'lar istiyorsa hangilerini? (örn: bookings, partners, users, hotels, rooms, rate-plans, seasons, payments, agencies)
- Lokal veritabanını dump'tan ÖNCE yedeklemek istiyor mu?

### 2. Production'dan Dump Al

SSH ile production sunucuya bağlan. MongoDB Docker container içinde çalışıyor, `docker exec` ile mongodump al:

```bash
# sshpass gerekli (interactive SSH desteklenmiyor)
# Tüm DB için:
sshpass -p 'CwQGE8NDAUU6eaH9siDg' ssh -o StrictHostKeyChecking=no root@85.31.238.34 \
  "docker exec minirez-mongodb rm -rf /tmp/db-dump && \
   docker exec minirez-mongodb mongodump --db booking-engine --out /tmp/db-dump --gzip && \
   docker cp minirez-mongodb:/tmp/db-dump /tmp/db-dump"

# Belirli collection için:
sshpass -p 'CwQGE8NDAUU6eaH9siDg' ssh -o StrictHostKeyChecking=no root@85.31.238.34 \
  "docker exec minirez-mongodb rm -rf /tmp/db-dump && \
   docker exec minirez-mongodb mongodump --db booking-engine --collection <COLLECTION_ADI> --out /tmp/db-dump --gzip && \
   docker cp minirez-mongodb:/tmp/db-dump /tmp/db-dump"
```

### 3. Dump'ı Lokal'e İndir

SCP ile dump dosyalarını lokal makineye çek:

```bash
rm -rf /tmp/db-dump
sshpass -p 'CwQGE8NDAUU6eaH9siDg' scp -o StrictHostKeyChecking=no -r root@85.31.238.34:/tmp/db-dump /tmp/db-dump
```

### 4. (Opsiyonel) Lokal Yedek Al

Kullanıcı isterse mevcut lokal DB'yi yedekle:

```bash
mongodump --db booking-engine --out /tmp/db-backup-$(date +%Y%m%d-%H%M%S) --gzip
```

### 5. Lokal'e Restore Et

```bash
# Tüm DB için (mevcut verilerin üzerine yazar):
mongorestore --db booking-engine --drop --gzip /tmp/db-dump/booking-engine

# Belirli collection için:
mongorestore --db booking-engine --collection <COLLECTION_ADI> --drop --gzip /tmp/db-dump/booking-engine/<COLLECTION_ADI>.bson.gz
```

### 6. Temizlik

Sunucudaki ve lokaldeki dump dosyalarını temizle:

```bash
# Sunucu (container + host)
sshpass -p 'CwQGE8NDAUU6eaH9siDg' ssh -o StrictHostKeyChecking=no root@85.31.238.34 \
  "rm -rf /tmp/db-dump && docker exec minirez-mongodb rm -rf /tmp/db-dump"

# Lokal
rm -rf /tmp/db-dump
```

### 7. Doğrulama

Restore sonrası lokal DB'de doğrulama yap. **Not:** Lokal ortamda `mongosh` yüklü olmayabilir, bu durumda Node.js ile doğrula:

```bash
# mongosh varsa:
mongosh booking-engine --eval "
  const collections = db.getCollectionNames();
  collections.forEach(c => {
    print(c + ': ' + db[c].countDocuments() + ' kayıt');
  });
"

# mongosh yoksa Node.js ile:
node -e "
const { MongoClient } = require('mongodb');
(async () => {
  const client = await MongoClient.connect('mongodb://localhost:27017');
  const db = client.db('booking-engine');
  const cols = await db.listCollections().toArray();
  for (const c of cols.sort((a,b) => a.name.localeCompare(b.name))) {
    const count = await db.collection(c.name).countDocuments();
    console.log(c.name + ': ' + count);
  }
  await client.close();
})();
"
```

## Önemli Kurallar

- Production MongoDB **Docker container** içinde çalışıyor (`minirez-mongodb`), direkt `mongodump` ÇALIŞMAZ
- `sshpass` kullan (interactive SSH prompt desteklenmiyor)
- Dump ve restore komutlarını çalıştırmadan ÖNCE her zaman kullanıcıdan onay al
- `--drop` flag'i mevcut collection'ı SİLER - kullanıcıyı uyar
- Lokal ortamda replicaSet bağlantısı varsa restore sorun çıkarabilir, doğrudan `localhost:27017` kullan
- Büyük veritabanları için `--gzip` kullanarak transfer süresini azalt
- İşlem bittiğinde sunucudaki ve lokaldeki geçici dump dosyalarını temizle
- `mongorestore --drop` index'leri silip yeniden oluşturur, Mongoose model tanımlarındaki index'ler restart'ta tekrar oluşturulur
