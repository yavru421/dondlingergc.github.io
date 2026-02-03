# Facebook Graph API Setup Guide

## Step 1: Create Facebook App

1. Go to https://developers.facebook.com/apps/
2. Click **"Create App"**
3. Select **"Business"** type
4. Fill in:
   - **App Name**: "DondlingerGC Website Feed"
   - **Contact Email**: your email
   - Click **Create App**

## Step 2: Get Page Access Token

1. In your app dashboard, go to **Tools** > **Graph API Explorer**
2. Click **"Generate Access Token"**
3. Select permissions:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_read_user_content`
4. Click **"Generate Access Token"** and authorize
5. Copy the token (starts with `EAAE...`)

## Step 3: Convert to Long-Lived Token

The token expires in 1 hour by default. Convert it to long-lived:

```bash
https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_LIVED_TOKEN
```

Replace:
- `YOUR_APP_ID` - from app dashboard
- `YOUR_APP_SECRET` - from app dashboard > Settings > Basic
- `YOUR_SHORT_LIVED_TOKEN` - the token you just generated

This returns a long-lived token (60 days).

## Step 4: Get Page Token (Never Expires!)

```bash
https://graph.facebook.com/v18.0/me/accounts?access_token=YOUR_LONG_LIVED_TOKEN
```

Copy the `access_token` for your page - **this token never expires!**

## Step 5: Add Token to Cloudflare

1. Go to Cloudflare Dashboard
2. Select your site: **dondlingergc.com**
3. Go to **Settings** > **Environment Variables**
4. Add new variable:
   - **Name**: `FACEBOOK_ACCESS_TOKEN`
   - **Value**: (paste the page access token from Step 4)
   - **Environment**: Production
5. Click **Save**

## Step 6: Deploy & Test

1. Push your code to GitHub (production branch)
2. Cloudflare will auto-deploy
3. Open your website
4. Click **START** > **Updates**
5. You should see your Facebook posts!

## For Client Sites

For each client:
1. Get their Facebook Page ID
2. Update the pageId in the API call
3. Use the same app/token (or create separate app per client for better security)

---

**Need Help?** Check the browser console for error messages.
