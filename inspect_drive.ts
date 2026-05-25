import "dotenv/config";
import { google } from "googleapis";
import * as path from "path";

const SERVICE_ACCOUNT_PATH = path.join(process.cwd(), "service-account.json");
const FOLDER_ID = "1VP_iLbSj7i1G2CN0cDJ4ww4TN4rcyX3f";

const auth = new google.auth.GoogleAuth({
  keyFile: SERVICE_ACCOUNT_PATH,
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});
const drive = google.drive({ version: "v3", auth });

async function run() {
  const res = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and trashed = false`,
    fields: "files(id, name, mimeType)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  
  for (const item of res.data.files || []) {
    if (item.mimeType === "application/vnd.google-apps.folder" && item.name?.toLowerCase().includes("semester")) {
      console.log(`\nInspecting ${item.name} (${item.id}):`);
      const subRes = await drive.files.list({
        q: `'${item.id}' in parents and trashed = false`,
        fields: "files(id, name, mimeType)",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      for (const subItem of subRes.data.files || []) {
        console.log(`  - ${subItem.name} (${subItem.mimeType === "application/vnd.google-apps.folder" ? "Folder" : "File"})`);
      }
    }
  }
}

run().catch(console.error);
