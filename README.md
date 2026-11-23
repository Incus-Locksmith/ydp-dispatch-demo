# YDP Locksmith Operations Demo

This is an isolated demonstration copy of the real Yay-wallboard application UI,
not the simplified browser card preview. It retains the original Dispatch Board,
Job Control Panel, Create Order, Technician Availability, call wallboard,
quotations, invoices, disputes/refund approval, payment chasing, management
reports, leaderboard, dispatch map and technician workspace.

## Run locally

Use Node 20 or newer:

    npm ci
    npm start

Open http://localhost:3000/jobs. PORT is honoured when supplied by hosting.
No external PostgreSQL, DATABASE_URL, SMS credentials or Stripe keys are used.
The database runs in memory and contains fictional sample records only.

Run the integration checks with `npm test`.

## Hosting

Intended demo repository: Incus-Locksmith/ydp-dispatch-demo.
Replace the application files in that DEMO repository only. Do not upload this
server to Incus-Locksmith/yay-wallboard or change the production database.

Render build command: npm ci
Render start command: npm start
Health check: /health
Demo entry: /jobs

This is a Node web service, not a static site. Check the existing demo service's
memory capacity before deploying. The final local integration run used about
446–488 MB RSS with the reduced 128 MB starting allocation; a 1 GB service leaves more headroom than a 512 MB service. No hosting
plan change or paid resource has been created by this work. Public/load testing
has not been performed.

## Two-choice sidebar

The left sidebar contains only:
1. Onboarding Journey (the website's existing onboarding preview)
2. Operations (this app's Dispatch Board)

Module links run across the top of Operations. The sample Technician view opens
Sam Ellis, who has a fictional dispute/recall context to explore. Everything is
labelled as demo data. The existing YDP brand logo is used.

## Data isolation and limits

Each browser receives a random HttpOnly demo cookie and its own PostgreSQL
schema, populated only from the fictional template. Session requests are queued
so SQL transactions cannot interleave across visitors. The pool never reads a
production database connection string. At most eight browser schemas are retained;
the oldest is evicted when a ninth is created. An evicted or expired browser
receives a fresh sample dataset. Restarting the app resets all data.

This is a temporary demo workspace, not production persistence or authentication.
Use fictional details only. The public preview role is Demo Manager, limited to
its own fictional schema. Production login code/configuration is untouched.

External fetches are disabled in the demo copy. Connected messaging, Stripe,
webhooks, postcode lookup, system administration and live customer accounts are
blocked. Relevant connected-service form buttons are disabled. No real messages,
payments, refunds, review requests or location collection occur. Sample map
coordinates and phone numbers are fictional. Location check-in uses fixed demo
coordinates, rather than asking the visitor for their real location.

Maps still need public map assets/tiles from the browser and were not visually verified in this update. PDF documents are demonstrations and carry fictional company details;
no genuine bank or company identifiers are used.

Refund actions retain the actual application's request, approval, paperwork and
completion workflow, updating only fictional records. Revenue Forecast is a demo
addition showing the sum of quoted open jobs, separately from completed values;
it is not a statistical prediction or a change to the production forecasting logic.

## Validation and provenance

The core UI comes from the Yay-wallboard server source pinned in SOURCE.txt.
Only the demo copy was modified. A management report link referenced an undefined
variable; that link was removed in the demo copy to restore the report page.

HTTP integration tests verify 23 routes plus job creation, quick assignment,
status changes, job closing, refund approval, independent browser data, blocked
connected actions and reset. No code was pushed or deployed. Desktop browser QA passed for the actual board layout and technician workspace. Public Render startup/performance and the website-to-app handoff remain to be verified after deployment.
