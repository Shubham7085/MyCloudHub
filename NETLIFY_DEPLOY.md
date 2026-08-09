# MyCloudHub — Netlify Deploy Guide

## Is session me kya fix hua

1. **`api/index.ts` corrupted tha** (do files ka code galti se mix ho gaya tha,
   ek undefined variable bhi tha) — clean kar diya. Ye sirf Vercel ke liye
   use hota hai, Netlify isse touch nahi karta.
2. **Google Drive "Connect" button kabhi kaam hi nahi kar sakta tha** —
   backend redirect karta hai, par frontend (`Dashboard.tsx` aur
   `ConnectedDrives.tsx`) popup + `postMessage` sun raha tha jo backend
   kabhi bhejta hi nahi tha. Ab dono jagah full-page redirect flow hai jo
   backend se match karta hai. `/drives` page par connect hone ke baad
   success/error message bhi dikhega.
3. **Login/Register poori tarah disabled the** ("maintenance" wala static
   page) aur `ProtectedRoute` auth check hi skip kar raha tha — matlab koi
   bhi bina login kiye Dashboard tak pahunch jaata tha, par saari API calls
   (drives fetch, drive connect, etc.) 401 Unauthorized deti thi. Ab dono
   working forms hain aur route protection wapas on hai.
4. **`update_drives.sh`** — ek purana script jo (agar kabhi run hota) drive
   connect ke fix ko wapas broken popup version me revert kar deta. Delete
   kar diya.
5. **Netlify support add kiya**: `netlify.toml`, `netlify/functions/api.ts`
   (Express app ko Netlify Function me wrap kiya), aur `serverless-http`
   dependency.

## Deploy karne ka process

### 1. GitHub pe push karo
Ye poora folder apne GitHub repo me commit + push kar do (GitHub.dev se ho
jaayega).

### 2. Netlify pe naya site banao
- netlify.com pe login karo → **Add new site → Import an existing project**
- Apna GitHub repo select karo
- Build settings netlify.toml se auto-detect ho jaayengi
  (`npm run build:netlify`, publish dir `dist`) — kuch change karne ki
  zaroorat nahi.

### 3. Environment variables set karo (Netlify: Site settings → Environment variables)
| Key | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | Google Cloud Console se |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console se |
| `JWT_SECRET` | koi bhi long random string |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase service account JSON (poora JSON string ya base64) |

### 4. Google Cloud Console me redirect URI update karo — **ye step sabse zaroori hai**
Google Cloud Console → APIs & Services → Credentials → apna OAuth 2.0
Client ID open karo → **Authorized redirect URIs** me add karo:

```
https://<tumhara-site-name>.netlify.app/api/drives/google/callback
```

(Baad me custom domain lagao to wo bhi add kar dena.) Isके bina Drive
connect "redirect_uri_mismatch" error dega — Netlify domain final hone ke
baad ye step zaroor karna.

### 5. Deploy trigger karo aur test karo
- Site deploy hone ke baad `/register` se account banao (ya `/login`)
- `/drives` page se "Connect Drive" try karo — ab poora tab Google pe
  redirect hoga, permission dene ke baad wapas `/drives?connected=true` pe
  aa jaayega.

## Jaankari rakhne layak baatein
- `NODE_ENV=production` set nahi kiya to demo user auto-seed hota rahega
  (dev convenience ke liye) — production me isse skip karne ke liye
  `NODE_ENV=production` bhi env var me daal sakte ho.
- File download endpoint (`/api/drives/:id/files/:fileId/download`) bade
  files (~several MB se zyada) ke liye serverless function ke response-size
  limit se struggle kar sakta hai — chhote/medium files ke liye fine hai.
  Future improvement: seedha Google Drive ka `webContentLink` use karo bade
  files ke liye.
- `vercel.json` abhi bhi repo me hai — agar kabhi Vercel pe wapas deploy
  karna ho to wo already kaam karega, Netlify ke liye usse ignore kar sakte ho.
