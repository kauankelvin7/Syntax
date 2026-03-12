# Deploy — Cinesia

## Opção 1 — Firebase Hosting (Recomendado)

### Pré-requisitos
```bash
npm install -g firebase-tools
firebase login
```

### Deploy manual
# Deploy — Syntax
```bash
cd frontend
npm run build
2. Nome: `syntax`
3. Selecione o repositório `syntax`
...existing code...
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Sender ID |
cd c:\Users\Kauan\Desktop\Syntax
| `VITE_FIREBASE_APP_ID` | Firebase App ID |
git commit -m "🎉 Initial commit - Syntax v1.0"
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Measurement ID |
git remote add origin https://github.com/SEU_USUARIO/syntax.git
| `VITE_GEMINI_API_KEY` | Google Gemini API Key |
Sua URL será algo como: `https://syntax.vercel.app`
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name |
Adicione seu domínio (ex: `syntax.com.br`)
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary Upload Preset |
Adicione: `syntax.vercel.app` (ou seu domínio customizado)
| `FIREBASE_SERVICE_ACCOUNT` | Conteúdo JSON do service account |

3. Publicar regras do Firestore:
```bash
firebase deploy --only firestore:rules
```

---

## Opção 2 — Vercel

1. Conectar repositório GitHub na Vercel
2. Configurar:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Adicionar as variáveis de ambiente no painel (Settings → Environment Variables)

---

## Variáveis de Ambiente

Não esqueça de configurar todas as variáveis listadas em `frontend/.env.example`.

> ⚠️ **NUNCA commitar o arquivo `.env`** com valores reais. Ele está no `.gitignore`.
