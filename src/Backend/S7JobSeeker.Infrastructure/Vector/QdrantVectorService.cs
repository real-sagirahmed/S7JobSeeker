using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Qdrant.Client;
using Qdrant.Client.Grpc;
using S7JobSeeker.Core.Interfaces;

namespace S7JobSeeker.Infrastructure.Vector;

public class QdrantVectorService : IQdrantVectorService
{
    private readonly QdrantClient _client;
    private readonly string _collectionName;
    private readonly ILogger<QdrantVectorService> _logger;
    private const ulong VectorDimension = 768; // Gemini text-embedding-004 default dimension
    private bool _isServiceAvailable = true;

    public QdrantVectorService(IConfiguration configuration, ILogger<QdrantVectorService> logger)
    {
        _logger = logger;
        var endpoint = configuration["QdrantSettings:Endpoint"] ?? "http://localhost:6334";
        var apiKey = configuration["QdrantSettings:ApiKey"];
        _collectionName = configuration["QdrantSettings:CollectionName"] ?? "tech-jobs";

        _client = new QdrantClient(new Uri(endpoint), apiKey: string.IsNullOrWhiteSpace(apiKey) ? null : apiKey);
    }

    public async Task EnsureCollectionExistsAsync(CancellationToken cancellationToken = default)
    {
        // Fail-fast timeout (2 seconds) to prevent blocking if local or remote Qdrant is offline
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(TimeSpan.FromSeconds(2));

        try
        {
            var exists = await _client.CollectionExistsAsync(_collectionName, cts.Token);
            if (!exists)
            {
                _logger.LogInformation("Creating Qdrant collection {Collection} with vector size {Size}...", _collectionName, VectorDimension);
                await _client.CreateCollectionAsync(
                    _collectionName,
                    new VectorParams { Size = VectorDimension, Distance = Distance.Cosine },
                    cancellationToken: cts.Token);
                _logger.LogInformation("Qdrant collection {Collection} created successfully.", _collectionName);
            }
            _isServiceAvailable = true;
        }
        catch (Exception ex)
        {
            _isServiceAvailable = false;
            _logger.LogWarning("Qdrant vector store is offline or unreachable ({Message}). Running in resilient relational-fallback mode.", ex.Message);
        }
    }

    public async Task UpsertJobVectorAsync(
        Guid pointId,
        ReadOnlyMemory<float> embedding,
        Dictionary<string, string> metadata,
        CancellationToken cancellationToken = default)
    {
        if (!_isServiceAvailable)
        {
            // Circuit breaker: skip vector upsert when Qdrant is offline
            return;
        }

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(TimeSpan.FromSeconds(3));

        try
        {
            var point = new PointStruct
            {
                Id = new PointId { Uuid = pointId.ToString() },
                Vectors = embedding.ToArray()
            };

            foreach (var (key, value) in metadata)
            {
                point.Payload.Add(key, value);
            }

            await _client.UpsertAsync(_collectionName, [point], cancellationToken: cts.Token);
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Skipping Qdrant point {PointId} ({Message}).", pointId, ex.Message);
        }
    }

    public async Task<IReadOnlyList<VectorSearchResult>> SearchSimilarJobsAsync(
        ReadOnlyMemory<float> queryEmbedding,
        int limit = 20,
        CancellationToken cancellationToken = default)
    {
        if (!_isServiceAvailable)
        {
            return [];
        }

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(TimeSpan.FromSeconds(3));

        try
        {
            var results = await _client.QueryAsync(
                _collectionName,
                query: queryEmbedding.ToArray(),
                limit: (ulong)limit,
                cancellationToken: cts.Token);

            var list = new List<VectorSearchResult>();
            foreach (var scoredPoint in results)
            {
                var payloadDict = scoredPoint.Payload.ToDictionary(k => k.Key, v => v.Value.StringValue ?? v.Value.ToString());
                var pointGuid = Guid.TryParse(scoredPoint.Id.Uuid, out var guid) ? guid : Guid.Empty;

                list.Add(new VectorSearchResult(pointGuid, scoredPoint.Score, payloadDict));
            }

            return list;
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Qdrant search query bypassed: {Message}", ex.Message);
            return [];
        }
    }
}
