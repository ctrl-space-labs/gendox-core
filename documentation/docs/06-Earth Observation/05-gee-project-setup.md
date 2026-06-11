---
sidebar_position: 5
---

# Set up a Google Earth Engine project ID

The [Earth Observation Task](./01-intro.md) uses **Google Earth Engine (GEE)** to render satellite imagery and run remote-sensing scripts. Google recently reduced the rate limits for the *shared* (anonymous) tier, which means without a project ID your map tiles may load slowly or fail intermittently.

This page walks you through:

1. Creating (or picking) a **Google Cloud project** to use with Earth Engine.
2. **Enabling the Earth Engine API** on that project.
3. Copying the **Project ID** and entering it in Gendox.

The whole process takes ~5 minutes and only needs to be done once per organization.

---

## Before you start

You will need:

- A **Google account** that has Earth Engine access. If your account is not yet signed up, register at <https://earthengine.google.com/signup/> first.
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

## Step 2 — Enable the Earth Engine API

With your project selected:

1. Go to **APIs & Services → Library**, or open directly: <https://console.cloud.google.com/apis/library/earthengine.googleapis.com>.
2. Make sure the project selector at the top still shows the project you want.
3. Click **ENABLE**.
4. Wait until the page refreshes and shows the **MANAGE** button — that means the API is enabled. (Allow a few minutes for the change to propagate to Earth Engine.)

:::info

You may also need to **register the Cloud project for Earth Engine use** at <https://code.earthengine.google.com/register> if this is a brand-new project. Choose the *"Register a Noncommercial or Commercial Cloud project"* option that matches your use, and pick the project you just created.

:::

---

## Step 3 — Copy the Project ID

The Project ID is **not** the project name. To find it:

1. Open the [Google Cloud Console Dashboard](https://console.cloud.google.com/home/dashboard).
2. Make sure the correct project is selected in the top bar.
3. In the **Project info** card (top-left), copy the value labelled **Project ID**. It looks like `gendox-eo-acme-12345`, all lowercase, with dashes.

![Project info card screenshot placeholder](./img/gee-project-id-location.png)

---

## Step 4 — Enter the Project ID in Gendox

1. In Gendox, open the user menu and go to **Organization Settings**.
2. Select the **Advanced Settings** tab.
3. Scroll to the **Connectors** section and expand the **Google Earth Engine** row.
4. Paste the Project ID into the **Project ID** field.
5. Click **Save**.

The next time you (or anyone in the organization) opens an Earth Observation Task, Earth Engine will be initialised against this project and use its quota instead of the shared pool.

---

## How to verify it worked

Open any **Earth Observation** Task. In the page header you should see the green/neutral chip:

> **GEE project: your-project-id**

If you instead see a yellow warning chip:

> **GEE project: "your-project-id" rejected — shared rate limits**

then one of the checks failed. The most likely causes are:

| Symptom | Cause | Fix |
| --- | --- | --- |
| Chip says *rejected* | Earth Engine API not enabled on this project | Revisit [Step 2](#step-2--enable-the-earth-engine-api). |
| Chip says *rejected* | Project ID is wrong (e.g. you pasted the project *name*) | Revisit [Step 3](#step-3--copy-the-project-id). |
| Chip says *rejected* | Your Google account does not have access to this project | Add your Google account as a *Viewer* (minimum) in **IAM & Admin → IAM** in the Cloud Console. |
| Chip says *not configured* | Empty `Project ID` field, or save did not go through | Re-enter the ID and click **Save** again. Refresh the EO Task. |

---

## Frequently asked questions

### Does each Gendox user need their own project ID?

No. The Project ID is **organization-level**: configure it once, and every member of the organization uses the same project. Each user still signs in with their own Google account to obtain an Earth Engine access token, but quota is billed to the shared project.

### Will I be charged?

Earth Engine is free for noncommercial use. Commercial Cloud projects are billed by Google according to [Earth Engine's pricing](https://earthengine.google.com/noncommercial/). Gendox does not add any fees on top.

### Can I change the Project ID later?

Yes. Repeat *Step 4* with a different ID. The change takes effect for new EO Task sessions; users currently inside a workspace need to reload the page.

### What happens if the project is disabled or wrong?

The workspace still opens, but Earth Engine falls back to the shared rate-limited tier and the header chip turns yellow. No data is lost — you simply experience slower tile loads until the project is fixed.
