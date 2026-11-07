namespace S7JobSeeker.Core.Interfaces;

public record VectorSearchResult(
    Guid PointId,
    float Score,
    Dictionary<string, string> Payload
);

public interface IQdrantVectorService
{
    Task EnsureCollectionExistsAsync(CancellationToken cancellationToken = default);
    Task UpsertJobVectorAsync(Guid pointId, ReadOnlyMemory<float> embedding, Dictionary<string, string> metadata, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<VectorSearchResult>> SearchSimilarJobsAsync(ReadOnlyMemory<float> queryEmbedding, int limit = 20, CancellationToken cancellationToken = default);
}
