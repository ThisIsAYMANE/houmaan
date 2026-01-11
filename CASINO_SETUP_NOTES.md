# Casino API Setup Notes

## Current Configuration

✅ **Merchant Key:** `b83d51ea35e2620a4e29913a9059e8e5038caa64`  
✅ **API Base URL:** `https://staging.slotegrator.com/api/index.php/v1`  
✅ **Callback URL:** `https://bozcallback.ngrok.app/api/casino/callback`  
✅ **Test Area URL:** `https://boztestarea.ngrok.app`  

## ⚠️ Still Needed

❌ **Merchant ID** - You still need to get this from Slotegrator

## Next Steps

### 1. Get Your Merchant ID

Contact your Slotegrator integration manager to get your **Merchant ID**. This is different from the Merchant Key.

### 2. Create Your .env File

Create a `.env` file in the project root (copy from `env.example`):

```bash
cp env.example .env
```

Then update the Casino API section with your actual values:

```env
# Slotegrator Casino API
CASINO_MERCHANT_ID=YOUR_MERCHANT_ID_HERE  # ⚠️ Get this from Slotegrator
CASINO_MERCHANT_KEY=b83d51ea35e2620a4e29913a9059e8e5038caa64
CASINO_API_BASE_URL=https://staging.slotegrator.com/api/index.php/v1
CASINO_CALLBACK_URL=https://bozcallback.ngrok.app/api/casino/callback
CASINO_TEST_AREA_URL=https://boztestarea.ngrok.app
```

### 3. Ensure ngrok is Running

Make sure your ngrok tunnels are active:
- `bozcallback.ngrok.app` → should point to your local callback endpoint
- `boztestarea.ngrok.app` → should point to your test area

### 4. Test the Configuration

Once you have your Merchant ID:

1. **Check readiness:**
   ```bash
   curl http://localhost:3000/api/casino/self-validate
   ```

2. **Launch a game** (to create an active session):
   ```bash
   POST /api/games/[id]/launch
   ```

3. **Run self-validation:**
   ```bash
   curl -X POST http://localhost:3000/api/casino/self-validate
   ```

## Important Notes

### API URL Format

The API URL you provided includes `/index.php/v1` which is correct for the staging environment:
- ✅ `https://staging.slotegrator.com/api/index.php/v1`
- The code automatically handles trailing slashes

### Callback URL

The callback URL should point to:
- `https://bozcallback.ngrok.app/api/casino/callback`

**Important:** You need to create the callback endpoint at `/app/api/casino/callback/route.ts` to handle incoming webhooks from Slotegrator.

### ngrok URLs

- **Callback URL:** Used by Slotegrator to send webhooks (balance, bet, win, refund, rollback)
- **Test Area URL:** For testing purposes (optional)

Make sure both ngrok tunnels are running and pointing to the correct local ports.

## Testing Checklist

- [ ] Merchant ID obtained from Slotegrator
- [ ] `.env` file created with all credentials
- [ ] ngrok tunnels active and pointing to correct ports
- [ ] Callback endpoint created (`/api/casino/callback`)
- [ ] Self-validation endpoint working
- [ ] Game launch working
- [ ] Callbacks receiving requests from Slotegrator

## Support

If you encounter issues:
1. Check that all environment variables are set correctly
2. Verify ngrok tunnels are active
3. Check that Merchant ID matches what Slotegrator provided
4. Review error logs in the console
5. Test self-validation endpoint first

