# Save orders & leads to Google Sheets (5 minutes)

1. Create a new Google Sheet, e.g. **Vindhya's Orders**.
2. Menu **Extensions → Apps Script**. Delete the sample code and paste everything from `apps-script/Code.gs`.
   (Optional: put your email in `NOTIFY_EMAIL` to get an alert for every order/lead.)
3. Click **Deploy → New deployment → type: Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**, approve the permissions, and copy the **Web app URL** (ends with `/exec`).
4. Open `script.js` and paste that URL into `var SHEET_URL = '';` near the top, then commit.
5. Test: add an item on the site, send the order, and check the **Orders** tab. The "Get offers" form fills the **Interested** tab.

Tabs and headers are created automatically. If you change `Code.gs` later, use **Deploy → Manage deployments → Edit → New version**.
