---
sidebar_position: 5
---

# Set up a Google Earth Engine project ID

The [Earth Observation Task](./01-intro.md) uses **Google Earth Engine (GEE)** to render satellite imagery and run remote-sensing scripts. Google recently reduced the rate limits for the *shared* (anonymous) tier, which means without a project ID your map tiles may load slowly or fail intermittently.

This page walks you through:

1. Creating (or picking) a **Google Cloud project** to use with Earth Engine.
2. **Creating a Google Earth Engine account** for your project (a one-time signup with Google).
3. Copying the **Project ID** and entering it in Gendox.

The whole process takes ~10 minutes and only needs to be done once per organization.

---

## Before you start

You will need:

- A **Google account** that you will use to sign in to Earth Engine through Gendox. Any personal or workspace Google account works. In Step 2 you will link that account to Earth Engine for your project.
- The right to manage Cloud projects on that Google account (any personal Google account works for a personal project; for a corporate account, ask your Google Workspace admin if you cannot create projects yourself).
- **Owner** or **Admin** access to your Gendox organization (so you can save the connector).

---

## Step 1 — Create or pick a Google Cloud project

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. In the top bar, click the **project selector** (it shows the current project name, or "Select a project").
3. To **reuse** an existing project, simply pick it from the list and skip to *Step 2*.
4. To **create a new project**, click **NEW PROJECT** in the dialog, give it a recognisable name (e.g. *"Gendox EO – Acme Corp"*), pick a billing account if prompted, and click **CREATE**.

:::tip

The project name is what you see in the UI. The **Project ID** (which is what Gendox needs) is auto-generated below the name and looks like `gendox-eo-acme-12345`. You can edit the ID **before** clicking CREATE, but not after.

:::

---

## Step 2 — Create a Google Earth Engine account

Google asks you to **sign up for Earth Engine** and link it to your Cloud project. Think of it as creating your Earth Engine account — a short form where you tell Google who you are and how you plan to use the service.

If you skip this step, you can still sign in to Gendox, but Earth Engine will not work. You may see an error like:

> *"Project &lt;your-id&gt; is not registered to use Earth Engine."*

### What to do

1. Open Google's Earth Engine signup page: [console.cloud.google.com/earth-engine/configuration](https://console.cloud.google.com/earth-engine/configuration).
2. At the top of the page, make sure the correct project is selected (the one you created in Step 1).
3. Click **Register** (or **Configure** if you have done this before).
4. Follow the on-screen wizard. Google will ask you a few questions:
   - **Who you are** — for example, an individual, a nonprofit, a school, a government body, or a business.
   - **Whether you qualify for free use** — if you are using Earth Engine for research, education, or nonprofit work (not for paid commercial products), you can usually choose the free *Noncommercial* option. Google may ask you to confirm this.
   - **Which plan you want** — most Gendox users who qualify pick *Noncommercial* (free). Businesses that need commercial use can choose a paid plan instead.
   - **What you plan to do** — a short description of your work. Google reads these to understand how people use Earth Engine.
   - **A final review** — check that everything looks right.
5. Click **Register** at the bottom to finish.

For the free noncommercial plan, access is usually granted right away. Paid plans may take a few minutes while Google sets up billing. When you are done, the page should show your project as *Registered*.

:::tip

If you used Earth Engine before and suddenly lost access (for example after switching to a new Google Workspace), go back to the same page and **re-verify your eligibility**. Earth Engine will not work until you do.

:::

### Double-check: enable the Earth Engine API

One more thing Google requires: the **Earth Engine API** must be turned on for your project. This is easy to miss, so it is worth confirming before you move on.

1. Open the Earth Engine API page: [console.cloud.google.com/apis/library/earthengine.googleapis.com](https://console.cloud.google.com/apis/library/earthengine.googleapis.com).
2. Make sure the project selector at the top still shows the project you want.
3. If you see an **ENABLE** button, click it and wait until the page shows **MANAGE** instead — that means the API is on. (It can take a few minutes to take effect.)
4. If you already see **MANAGE**, you are all set — the API is already enabled.

:::info

You need both steps above for Gendox to work: your Earth Engine account (the signup wizard) **and** the Earth Engine API enabled on the same project. If either one is missing, maps may fail to load or show a *rate limited* warning in Gendox.

:::

---

## Step 3 — Copy the Project ID

The Project ID is **not** the project name. To find it:

1. Open the [Google Cloud Console Dashboard](https://console.cloud.google.com/home/dashboard).
2. Make sure the correct project is selected in the top bar.
3. In the **Project info** card (top-left), copy the value labelled **Project ID**. It looks like `gendox-eo-acme-12345`, all lowercase, with dashes.

---

## Step 4 — Enter the Project ID in Gendox

1. In Gendox, open the user menu and go to **Organization Settings**.
2. Select the **Advanced Settings** tab.
3. Scroll to the **Connectors** section. You will see a row labelled **Google Earth Engine** with a (currently empty) **Project ID** field.
4. Click the **pencil/edit icon** next to the row to open the configuration dialog.
5. Paste the Project ID into the **Project ID** field.
6. Click **Save**.

Saving automatically clears any cached Earth Engine session for your organization, so the next time you (or anyone in the organization) opens an Earth Observation Task, Earth Engine will be re-initialised against this project and use its quota instead of the shared pool.

:::tip

To remove the configured project later, click the **red delete icon** on the same row instead of editing — this drops the connector and the EO workspace falls back to the shared rate-limited tier.

:::

---

## How to verify it worked

Open any **Earth Observation** Task. In the page header (top right) you should see two chips:

- 📧 **Google account chip** — shows the email of the Google account you signed in with (e.g. `you@example.com`).
- ☁️ **Project chip** — shows the status of the GEE project.

A **healthy** setup looks like this:

> **🟢 your-project-id** *(neutral blue, with a cloud-check icon)*

It means Earth Engine accepted your project and is billing requests to it. Hovering shows a tooltip: *"Earth Engine quota is billed to Google Cloud project &lt;your-project-id&gt;"*.

If instead you see a **yellow warning** chip:

> **🟡 your-project-id · rate limited** *(orange, with a warning icon, clickable)*

…then Earth Engine **rejected** the project and the workspace fell back to the shared default tier. Click the chip to jump straight to Org Settings → Connectors. Hovering shows the specific cause.

If no project ID is configured at all:

> **🟡 No project · rate limited**

### Extra check from the browser console

You can ask the Earth Engine library directly which project it is using. Open DevTools → Console and run:

```js
ee.apiclient.getProject()
```

| Return value | Meaning |
| --- | --- |
| `"your-project-id"` | ✅ Project is active. Requests go to `/v1/projects/<your-project-id>/...` |
| `"earthengine-legacy"` | ⚠️ Workspace is on the shared default tier (fallback active) |
| `null` or `undefined` | EE is not yet initialised (or failed) |

### Troubleshooting

The most likely causes if the chip turns yellow or sign-in fails are:

| Symptom | Cause | Fix |
| --- | --- | --- |
| Sign-in shows the red *"Google hasn't verified this app"* screen | Your Auth Platform is in Testing mode and your account is not on the test user list | Add yourself as a *Test user* under **Audience** in the Google Auth Platform, or submit the app for verification. |
| Chip says *rate limited* | Earth Engine API not enabled on this project | Revisit the [Double-check: enable the Earth Engine API](#double-check-enable-the-earth-engine-api) section in [Step 2](#step-2--create-a-google-earth-engine-account). |
| Chip says *rate limited* | Earth Engine account not set up for this project | Revisit [Step 2](#step-2--create-a-google-earth-engine-account). |
| Chip says *rate limited* | Project ID is wrong (e.g. you pasted the project *name*) | Revisit [Step 3](#step-3--copy-the-project-id). |
| Chip says *rate limited* | Your Google account does not have access to this project | Add your Google account as a *Viewer* (minimum) in **IAM & Admin → IAM** in the Cloud Console. |
| Chip says *No project · rate limited* | Empty `Project ID` field, no connector saved | Re-enter the ID via Org Settings and click **Save** again. Refresh the EO Task. |

---

## Frequently asked questions

### Does each Gendox user need their own project ID?

No. The Project ID is **organization-level**: configure it once, and every member of the organization uses the same project. Each user still signs in with their own Google account to obtain an Earth Engine access token, but quota is billed to the shared project.

### Will I be charged?

Earth Engine is free for projects registered under the [noncommercial plan](https://earthengine.google.com/noncommercial/). Commercial Cloud projects are billed by Google according to [Earth Engine's pricing](https://cloud.google.com/earth-engine/pricing). Gendox does not add any fees on top.

### Can I change the Project ID later?

Yes. Repeat *Step 4* with a different ID. Gendox automatically clears the cached Earth Engine session for your organization when you save, so the next time an EO Task is opened, Earth Engine re-initialises with the new project. Users currently inside a workspace will be prompted to sign in again on their next page load.

### What happens if the project is disabled or wrong?

The workspace still opens, but Earth Engine falls back to the shared rate-limited tier and the header chip turns yellow. No data is lost — you simply experience slower tile loads until the project is fixed.
