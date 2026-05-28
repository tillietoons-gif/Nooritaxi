# Google Cloud Deployment

The backend is prepared for Cloud Run with Artifact Registry and Cloud Build.

## One-Time Setup

```bash
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com
gcloud artifacts repositories create noori --repository-format=docker --location=asia-south1
gcloud secrets create noori-database-url --data-file=-
gcloud secrets create noori-jwt-secret --data-file=-
```

Use Cloud SQL for PostgreSQL or any managed PostgreSQL provider and store the connection string in `noori-database-url`.

## Deploy

```bash
gcloud builds submit --config gcp/cloudbuild-backend.yaml .
```

## Automatic Deploys From GitHub

Pushes to `main` or `feat/noori-super-app-complete-911282070275060773` run `.github/workflows/deploy-gcloud.yml`.
The workflow authenticates with Google Cloud through Workload Identity Federation and deploys both Cloud Run services:

- `noori-backend`
- `noori-web`

Required GitHub repository variables:

- `GCP_PROJECT_ID`
- `GCP_WIF_PROVIDER`
- `GCP_DEPLOY_SERVICE_ACCOUNT`

## Cloud Run Service Template

`gcp/cloud-run-backend.yaml` is a declarative Cloud Run service template. Replace:

- `PROJECT_ID`
- `REGION`
- `https://YOUR_WEB_DOMAIN`

Then apply it with:

```bash
gcloud run services replace gcp/cloud-run-backend.yaml --region asia-south1
```
