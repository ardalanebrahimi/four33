using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace Four33.Api.Services;

public interface IBlobStorageService
{
    Task<string> UploadAudioAsync(IFormFile file, Guid userId);
    Task DeleteAudioAsync(string blobUrl);
}

public class BlobStorageService : IBlobStorageService
{
    private readonly BlobContainerClient _containerClient;
    private readonly string _cdnBaseUrl;

    public BlobStorageService(IConfiguration configuration)
    {
        var connectionString = configuration["Azure:BlobStorage:ConnectionString"]
            ?? throw new InvalidOperationException("Azure:BlobStorage:ConnectionString not configured");

        var containerName = configuration["Azure:BlobStorage:ContainerName"] ?? "audio";
        _cdnBaseUrl = configuration["Azure:BlobStorage:CdnBaseUrl"] ?? "";

        var blobServiceClient = new BlobServiceClient(connectionString);
        _containerClient = blobServiceClient.GetBlobContainerClient(containerName);
    }

    public async Task<string> UploadAudioAsync(IFormFile file, Guid userId)
    {
        await _containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob);

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(extension))
        {
            extension = ".wav"; // Default to WAV
        }

        var blobName = $"{userId}/{Guid.NewGuid()}{extension}";
        var blobClient = _containerClient.GetBlobClient(blobName);

        var contentType = extension.ToLower() switch
        {
            ".wav" => "audio/wav",
            ".mp3" => "audio/mpeg",
            ".webm" => "audio/webm",
            ".m4a" => "audio/mp4",
            ".ogg" => "audio/ogg",
            _ => "audio/wav"
        };

        await using var stream = file.OpenReadStream();
        await blobClient.UploadAsync(stream, new BlobHttpHeaders
        {
            ContentType = contentType,
            CacheControl = "public, max-age=31536000" // 1 year cache
        });

        // Return CDN URL if configured, otherwise blob URL
        if (!string.IsNullOrEmpty(_cdnBaseUrl))
        {
            return $"{_cdnBaseUrl.TrimEnd('/')}/{blobName}";
        }

        return blobClient.Uri.ToString();
    }

    public async Task DeleteAudioAsync(string blobUrl)
    {
        try
        {
            // Extract blob name from URL
            var uri = new Uri(blobUrl);
            var blobName = uri.AbsolutePath.TrimStart('/');

            // Remove container name from path if present
            var containerName = _containerClient.Name;
            if (blobName.StartsWith($"{containerName}/"))
            {
                blobName = blobName[(containerName.Length + 1)..];
            }

            var blobClient = _containerClient.GetBlobClient(blobName);
            await blobClient.DeleteIfExistsAsync();
        }
        catch
        {
            // Log but don't throw - blob might not exist or URL might be invalid
        }
    }
}

/// <summary>
/// In-memory blob storage for local development without Azure
/// </summary>
public class LocalBlobStorageService : IBlobStorageService
{
    private readonly string _basePath;
    private readonly string _baseUrl;

    public LocalBlobStorageService(IConfiguration configuration, IWebHostEnvironment env)
    {
        _basePath = Path.Combine(env.ContentRootPath, "uploads");
        _baseUrl = configuration["LocalStorage:BaseUrl"] ?? "/uploads";
        Directory.CreateDirectory(_basePath);
    }

    public async Task<string> UploadAudioAsync(IFormFile file, Guid userId)
    {
        var userDir = Path.Combine(_basePath, userId.ToString());
        Directory.CreateDirectory(userDir);

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(extension))
        {
            extension = ".wav";
        }

        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(userDir, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        return $"{_baseUrl}/{userId}/{fileName}";
    }

    public Task DeleteAudioAsync(string blobUrl)
    {
        try
        {
            var uri = new Uri(blobUrl, UriKind.RelativeOrAbsolute);
            var relativePath = uri.IsAbsoluteUri ? uri.AbsolutePath : blobUrl;
            relativePath = relativePath.Replace(_baseUrl, "").TrimStart('/');

            var filePath = Path.Combine(_basePath, relativePath);
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
        }
        catch
        {
            // Ignore errors
        }

        return Task.CompletedTask;
    }
}
