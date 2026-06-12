---
sidebar_position: 5
---

# Set up a Google Earth Engine project ID

The [Earth Observation Task](./01-intro.md) uses **Google Earth Engine (GEE)** to render satellite imagery and run remote-sensing scripts. Google recently reduced the rate limits for the *shared* (anonymous) tier, which means without a project ID your map tiles may load slowly or fail intermittently.

This page walks you through:

1. Creating (or picking) a **Google Cloud project** to use with Earth Engine.
2. **Enabling the Earth Engine API** on that project.
3. **Registering the project with Earth Engine** (separate from enabling the API — required for noncommercial or commercial use).
4. **Registering the OAuth scopes** Gendox needs to call Earth Engine on the user's behalf.
5. Copying the **Project ID** and entering it in Gendox.

The whole process takes ~10 minutes and only needs to be done once per organization.

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

---

## Step 3 — Register the project with Earth Engine

Enabling the Earth Engine API (Step 2) is **not enough on its own**. Google requires every Cloud project that calls Earth Engine to also go through a separate **Earth Engine registration** that declares whether the project will be used for *noncommercial* (research, education, nonprofit) or *commercial* purposes. Without this step, Gendox sign-in succeeds but the first Earth Engine call fails with:

> *"Project &lt;your-id&gt; is not registered to use Earth Engine."*

1. Open the Earth Engine registration page for your project: <https://console.cloud.google.com/earth-engine/configuration>.
2. Make sure the project selector at the top shows the project you want (the URL also accepts a `?project=<your-project-id>` parameter).
3. Click **Register** (or **Configure** if the project was registered before).
4. Walk through the 5-step wizard:
   1. **Select your organization type** — pick the entity that owns the project (individual, nonprofit, academic, government, business, etc.).
   2. **Check noncommercial eligibility** — if you intend to use the project for free under the noncommercial tier, fill in your nonprofit/educational institution name and confirm you will not receive payment for Earth Engine outputs. Click **Check eligibility**.
   3. **Choose your plan** — Noncommercial (free), Professional, Premium, or pay-as-you-go. For most internal Gendox setups, *Noncommercial* is fine if you qualify.
   4. **Describe your work** — a short paragraph about how you intend to use Earth Engine. Google reads these.
   5. **Review summary** — confirm the details.
5. Click **Register** at the bottom.

The registration is typically activated **immediately** for noncommercial use; commercial plans require billing setup and may take a few minutes. After it is active, the Configuration page shows the project as *Registered* with the chosen plan.

:::tip

If you previously registered the project for noncommercial use and lost access (e.g. after a Workspace migration), you must **re-verify eligibility** at the same URL — Earth Engine will reject API calls until you do.

:::

---

## Step 4 — Register the OAuth scopes

When a user signs in to Earth Engine through Gendox, the browser asks Google's OAuth consent screen for permission to call the Earth Engine API on the user's behalf. That permission ("scope") must be **declared in advance** in your Google Auth Platform configuration — otherwise the user either sees an "unverified app" warning, or Gendox is rejected with *"Request had insufficient authentication scopes"* immediately after sign-in.

Gendox requests **two** OAuth scopes:

| Scope | What it allows | Why Gendox needs it |
| --- | --- | --- |
| `https://www.googleapis.com/auth/earthengine` | View and manage your Google Earth Engine data | Run EE algorithms and request tiles on the user's behalf. |
| `https://www.googleapis.com/auth/userinfo.email` | See your primary Google Account email address | Display the connected Google account in the workspace header. |

To register both:

1. Open the **Data Access** page of the Google Auth Platform for your project: <https://console.cloud.google.com/auth/scopes>.
2. Make sure the project selector at the top still shows the project you want.
3. Click **Add or remove scopes**.
4. In the filter, type `earthengine` and tick the entry:
   - `https://www.googleapis.com/auth/earthengine` — *"View and manage your Google Earth Engine data"*
5. Clear the filter and type `userinfo.email` (or just `email`) and tick the entry:
   - `https://www.googleapis.com/auth/userinfo.email` — *"See your primary Google Account email address"*
6. Click **Update**, then **Save** at the bottom of the Data Access page.

After saving you should see both scopes listed (the `earthengine` one usually under *Your non-sensitive scopes* — or *sensitive* depending on Google's current classification — and `userinfo.email` under *Your non-sensitive scopes*):

| API | Scope | User-facing description |
| --- | --- | --- |
| Google Earth Engine API | `.../auth/earthengine` | View and manage your Google Earth Engine data |
| Google OAuth2 API | `.../auth/userinfo.email` | See your primary Google Account email address |

:::tip

Technically `userinfo.email` is auto-allowed by Google even when not declared — but we recommend registering it explicitly so the Data Access page truthfully reflects every scope Gendox asks for. This also avoids friction when you submit the app for **verification** later, since Google's review requires every requested scope to be declared upfront.

:::

:::info

If your Google Auth Platform is in **Testing** mode (the default for new projects), only users you explicitly add as **Test users** under the *Audience* tab will get past the "unverified app" warning. Add the Google accounts of every Gendox user who will sign in to Earth Engine, or submit the app for verification when you go to production.

:::

---

## Step 5 — Copy the Project ID

The Project ID is **not** the project name. To find it:

1. Open the [Google Cloud Console Dashboard](https://console.cloud.google.com/home/dashboard).
2. Make sure the correct project is selected in the top bar.
3. In the **Project info** card (top-left), copy the value labelled **Project ID**. It looks like `gendox-eo-acme-12345`, all lowercase, with dashes.

![Project info card screenshot placeholder](./img/gee-project-id-location.png)

---

## Step 6 — Enter the Project ID in Gendox

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
| Sign-in fails with *"insufficient authentication scopes"* | The `earthengine` scope is not declared in the Google Auth Platform | Revisit [Step 4](#step-4--register-the-oauth-scopes). |
| Sign-in shows the red *"Google hasn't verified this app"* screen | Your Auth Platform is in Testing mode and your account is not on the test user list | Add yourself as a *Test user* under **Audience** in the Google Auth Platform, or submit the app for verification. |
| Chip says *rejected* | Earth Engine API not enabled on this project | Revisit [Step 2](#step-2--enable-the-earth-engine-api). |
| Chip says *rejected* | Project is enabled but **not registered** with Earth Engine | Revisit [Step 3](#step-3--register-the-project-with-earth-engine). |
| Chip says *rejected* | Project ID is wrong (e.g. you pasted the project *name*) | Revisit [Step 5](#step-5--copy-the-project-id). |
| Chip says *rejected* | Your Google account does not have access to this project | Add your Google account as a *Viewer* (minimum) in **IAM & Admin → IAM** in the Cloud Console. |
| Chip says *not configured* | Empty `Project ID` field, or save did not go through | Re-enter the ID and click **Save** again. Refresh the EO Task. |

---

## Frequently asked questions

### Does each Gendox user need their own project ID?

No. The Project ID is **organization-level**: configure it once, and every member of the organization uses the same project. Each user still signs in with their own Google account to obtain an Earth Engine access token, but quota is billed to the shared project.

### Will I be charged?

Earth Engine is free for noncommercial use. Commercial Cloud projects are billed by Google according to [Earth Engine's pricing](https://earthengine.google.com/noncommercial/). Gendox does not add any fees on top.

### Can I change the Project ID later?

Yes. Repeat *Step 6* with a different ID. The change takes effect for new EO Task sessions; users currently inside a workspace need to reload the page.

### What happens if the project is disabled or wrong?

The workspace still opens, but Earth Engine falls back to the shared rate-limited tier and the header chip turns yellow. No data is lost — you simply experience slower tile loads until the project is fixed.
