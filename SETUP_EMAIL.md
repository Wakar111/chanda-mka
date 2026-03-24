# 📧 E-Mail-Funktion Setup-Anleitung

## 🎯 Übersicht
Diese Anleitung hilft dir, die E-Mail-Funktion mit Gmail und Netlify Functions einzurichten.

---

## 📋 Schritt 1: Gmail App-Passwort erstellen

### ⚠️ WICHTIG: Normales Gmail-Passwort funktioniert NICHT!

Du benötigst ein **App-Passwort** von Google.

### Anleitung:

1. **Gehe zu Google Account:**
   - Öffne: https://myaccount.google.com/apppasswords
   - Melde dich mit deinem Gmail-Account an

2. **2-Faktor-Authentifizierung aktivieren** (falls noch nicht aktiv):
   - Gehe zu: https://myaccount.google.com/security
   - Aktiviere "2-Step Verification"
   - Folge den Anweisungen

3. **App-Passwort generieren:**
   - Zurück zu: https://myaccount.google.com/apppasswords
   - Wähle "Mail" als App
   - Wähle "Anderes Gerät" und gib ein: "Chanda App"
   - Klicke "Generieren"

4. **Passwort kopieren:**
   - Du erhältst ein 16-stelliges Passwort (z.B. `abcd efgh ijkl mnop`)
   - **WICHTIG:** Kopiere es sofort, es wird nur einmal angezeigt!
   - Entferne alle Leerzeichen: `abcdefghijklmnop`

---

## 📋 Schritt 2: Netlify Functions Dependencies installieren

```bash
# Im Projekt-Root-Verzeichnis
cd netlify/functions
npm install

# Oder falls npm install nicht funktioniert:
npm install nodemailer @supabase/supabase-js
```

---

## 📋 Schritt 3: Environment Variables in Netlify setzen

### In Netlify Dashboard:

1. **Gehe zu deiner Site:**
   - Netlify Dashboard → Deine Site auswählen

2. **Site Settings → Environment Variables:**
   - Klicke auf "Add a variable"

3. **Füge folgende Variablen hinzu:**

```
Variable 1:
Key:   SUPABASE_URL
Value: https://deine-project-id.supabase.co

Variable 2:
Key:   SUPABASE_SERVICE_KEY
Value: eyJhbGc... (dein Service Role Key aus Supabase)

Variable 3:
Key:   GMAIL_USER
Value: deine-email@gmail.com

Variable 4:
Key:   GMAIL_APP_PASSWORD
Value: abcdefghijklmnop (das 16-stellige App-Passwort OHNE Leerzeichen)
```

### Wo finde ich den Supabase Service Key?

1. Gehe zu: https://supabase.com/dashboard
2. Wähle dein Projekt
3. Settings → API
4. Kopiere den **service_role** Key (NICHT den anon key!)

---

## 📋 Schritt 4: Lokales Testen (Optional)

### .env Datei erstellen:

```bash
# Im Projekt-Root
cp .env.example .env
```

### .env bearbeiten:

```env
SUPABASE_URL=https://deine-project-id.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
GMAIL_USER=deine-email@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

### Netlify Dev starten:

```bash
# Installiere Netlify CLI (falls noch nicht installiert)
npm install -g netlify-cli

# Starte lokalen Dev-Server
netlify dev
```

Die App läuft dann auf: http://localhost:8888

---

## 📋 Schritt 5: Deployen

```bash
# Änderungen committen
git add .
git commit -m "Add email functionality with Netlify Functions"
git push

# Netlify deployed automatisch!
```

---

## ✅ Schritt 6: Testen

1. **Gehe zur Benachrichtigung-Seite:**
   - Melde dich als Admin an
   - Navigiere zu "Benachrichtigung"

2. **Test-E-Mail senden:**
   - Betreff: "Test"
   - Nachricht: "Dies ist eine Test-E-Mail"
   - Klicke "E-Mail an alle Mitglieder senden"

3. **Prüfe:**
   - Erfolgs-Nachricht erscheint
   - E-Mails kommen bei allen Empfängern an
   - Prüfe Spam-Ordner!

---

## 🚨 Troubleshooting

### Problem: "Gmail-Anmeldung fehlgeschlagen"

**Lösung:**
- Überprüfe GMAIL_USER (richtige E-Mail?)
- Überprüfe GMAIL_APP_PASSWORD (16 Zeichen, keine Leerzeichen?)
- Stelle sicher, dass 2FA aktiviert ist
- Generiere neues App-Passwort

### Problem: "Fehler beim Laden der Empfänger"

**Lösung:**
- Überprüfe SUPABASE_URL
- Überprüfe SUPABASE_SERVICE_KEY (nicht anon key!)
- Stelle sicher, dass users Tabelle existiert

### Problem: E-Mails landen im Spam

**Lösung:**
- Normal bei ersten E-Mails
- Empfänger sollen E-Mail als "Kein Spam" markieren
- Nach einigen E-Mails verbessert sich Reputation

### Problem: "Recipient limit exceeded"

**Lösung:**
- Gmail Limit: 500 E-Mails/Tag
- Für >500 Empfänger: Auf SendGrid/Resend umsteigen
- Oder: E-Mails in Batches senden

---

## 📊 Gmail Limits

```
Kostenloser Gmail Account:
- 500 E-Mails pro Tag
- 100 Empfänger pro E-Mail (BCC)

Google Workspace (kostenpflichtig):
- 2000 E-Mails pro Tag
- 500 Empfänger pro E-Mail
```

**Für eure 400 Mitglieder:**
- ✅ Passt in Gmail Free Tier
- ✅ 1x pro Tag möglich
- ⚠️ Bei >500 Mitgliedern: Upgrade nötig

---

## 🔒 Sicherheit

### ⚠️ WICHTIG:

1. **Niemals** Environment Variables in Git committen!
2. `.env` ist in `.gitignore` (bereits erledigt)
3. App-Passwort ist **NUR** für diese App
4. Bei Verdacht auf Kompromittierung: Neues App-Passwort generieren

---

## 📞 Support

Bei Problemen:
1. Prüfe Netlify Function Logs: Site → Functions → send-email → Logs
2. Prüfe Browser Console (F12)
3. Prüfe Gmail "Gesendete Objekte"

---

## ✅ Checkliste

- [ ] 2-Faktor-Authentifizierung aktiviert
- [ ] App-Passwort generiert
- [ ] Environment Variables in Netlify gesetzt
- [ ] Dependencies installiert (`npm install` in netlify/functions)
- [ ] Deployed
- [ ] Test-E-Mail erfolgreich gesendet
- [ ] E-Mails kommen an

**Viel Erfolg! 🎉**
