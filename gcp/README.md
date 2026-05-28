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

## Cloud Run Service Template

`gcp/cloud-run-backend.yaml` is a declarative Cloud Run service template. Replace:

- `PROJECT_ID`
- `REGION`
- `https://YOUR_WEB_DOMAIN`

Then apply it with:

```bash
gcloud run services replace gcp/cloud-run-backend.yaml --region asia-south1
```
