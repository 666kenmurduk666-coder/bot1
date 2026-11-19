# 🚀 Step-by-step: pag-upload ng Cyborg Office

Hindi na kailangang mag-install ng Git. Gawin natin sa browser.

## A. Ano ang tapos na
- Final `server.js` at `public/index.html` ay nasa `C:\Users\PC\Desktop\bot1-upload\`.
- Parehong hash sa local — ibig sabihin, eksaktong kopya.
- Lokal na tested: walang syntax error, walang console error.

## B. Ito ang gagawin mo (2 login lang)

1. Sa OpenCode **Review pane**, hanapin ang tab na **Render Dashboard**.
   - May login page na bukas: `https://dashboard.render.com/login-next`
   - I-type mo doon ang email/password mo para makapasok.
   - **Huwag i-type sa chat.** Nandoon lang sa browser tab.

2. Hanapin ang tab na **GitHub**.
   - Bukas na: `https://github.com/`
   - Mag-log in din doon.

3. Kapag tapos ka na, sabihin lang: **“tapos na mag-login”**.

## C. Ano ang gagawin ko pagkatapos
1. Hanapin ko ang repo ng `cyborgcheebeeworkspace` sa GitHub.
2. I-upload ko ang dalawang updated files gamit ang GitHub web upload:
   - `server.js`
   - `public/index.html`
3. Mag-commit ako ng message na: `Deploy Cyborg Office: goods-only, bot check, Christmas, Shopee rush`.
4. Render ay auto-deploy mula sa repo.
5. Hintayin ko ang deploy logs, tapos ie-verify ko ang:
   - `https://cyborgcheebeeworkspace-d7sf.onrender.com/api/bazaar/info`
   - `https://cyborgcheebeeworkspace-d7sf.onrender.com/api/proof`

## D. Kung ayaw mag-login sa GitHub
Pwede rin ang **Render Deploy Hook**:
1. Sa Render dashboard, pumunta sa service → **Settings** → **Deploy Hook**.
2. Kopyahin ang hook URL.
3. Ilagay sa file na ito:

   `C:\Users\PC\Desktop\bot1\data\deploy.json`

   Halimbawa ng itsura (palitan ang halaga):

   ```json
   {
     "deployHook": "DITO_IYONG_HOOK_URL"
   }
   ```

4. Sabihin mo **“nasa file na”**. Hindi ko ipi-print ang value; gagamitin ko lang para i-trigger ang deploy.

## E. Paalala
- `data/settings.json`, `data/state.json`, at `data/deploy.json` ay **hindi** ina-upload sa GitHub.
- Walang Facebook/YouTube password na itinatago sa app. OAuth/token lang, server-side.
- Hindi mabubura ang local copy; nasa `C:\Users\PC\Desktop\bot1` pa rin ang master.
