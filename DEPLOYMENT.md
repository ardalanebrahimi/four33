# Deployment Guide

## Backend Deployment (Azure App Service)

### Prerequisites
- Azure CLI installed and logged in (`az login`)
- .NET 8 SDK installed

### Azure Resources Required
1. **Resource Group** - Container for all resources
2. **Azure PostgreSQL Flexible Server** - Database
3. **Azure Storage Account** - Blob storage for audio files
4. **Azure App Service** - Hosting the API

### Configuration

#### 1. Create Azure Resources (Portal or CLI)

```bash
# Create resource group
az group create --name <resource-group> --location westeurope

# Create PostgreSQL (use Azure Portal for easier setup)
# Create Storage Account (use Azure Portal)
# Create App Service (use Azure Portal or CLI)
az webapp create --name <app-name> --resource-group <resource-group> --runtime "DOTNETCORE:8.0" --os-type Linux
```

#### 2. Configure App Service Settings

Set these application settings in Azure Portal or via CLI:

```bash
az webapp config appsettings set --name <app-name> --resource-group <resource-group> --settings \
  ConnectionStrings__DefaultConnection="Host=<postgres-host>;Database=<db-name>;Username=<username>;Password=<password>;SSL Mode=Require;Trust Server Certificate=true" \
  Jwt__Secret="<your-256-bit-secret-key>" \
  Jwt__Issuer="<your-api-url>" \
  Jwt__Audience="<your-api-url>" \
  Azure__BlobStorage__ConnectionString="<storage-connection-string>" \
  Azure__BlobStorage__ContainerName="audio"
```

#### 3. Configure CORS

Add allowed origins for your frontend:

```bash
az webapp cors add --name <app-name> --resource-group <resource-group> --allowed-origins \
  "https://localhost" \
  "capacitor://localhost" \
  "ionic://localhost" \
  "http://localhost:4200" \
  "http://localhost:8100"
```

#### 4. Build and Deploy

```bash
cd backend/Four33.Api

# Publish the application
dotnet publish -c Release -o ./publish

# Create deployment zip
# Windows PowerShell:
Compress-Archive -Path ./publish/* -DestinationPath ./deploy.zip -Force

# Deploy to Azure
az webapp deployment source config-zip --name <app-name> --resource-group <resource-group> --src ./deploy.zip
```

### Local Development

1. Copy `appsettings.Development.json.example` to `appsettings.Development.json`
2. Fill in your local/development credentials
3. Run `dotnet run`

The API will use in-memory database if no connection string is provided.

---

## Frontend Deployment

### Environment Configuration

1. Copy `src/environments/environment.ts.example` to `src/environments/environment.ts`
2. Set your API URL

### Building for Production

```bash
npm run build
```

### Building for Android

```bash
npm run build
npx cap sync android
npx cap open android
```

### Building for iOS

```bash
npm run build
npx cap sync ios
npx cap open ios
```

---

## Environment Variables Reference

### Backend (Azure App Service)

| Setting | Description |
|---------|-------------|
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection string |
| `Jwt__Secret` | JWT signing key (min 32 chars) |
| `Jwt__Issuer` | Token issuer URL |
| `Jwt__Audience` | Token audience URL |
| `Azure__BlobStorage__ConnectionString` | Azure Storage connection string |
| `Azure__BlobStorage__ContainerName` | Blob container name (default: audio) |

### Frontend

| Setting | Description |
|---------|-------------|
| `apiUrl` | Backend API base URL |
