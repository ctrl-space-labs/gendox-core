# Database


Database used in Postgres v15 (to be updated to v17). 

## Embeddings table

The most resource intensive (and most important) table in the application is the gendox_core.embeddings table.
It is used to store the semantic embeddings of the application. Each embedding is a double[] of size 1536 (it can be less, rarely it can be more).

### PGVector plugin

PGVector plugin is used to manage embeddings. You can follow [pgvector documentation](https://github.com/pgvector/pgvector?tab=readme-ov-file#docker-1) on how to upgrade the plugin.
Gendox is using the Pluing's Docker image to run the whole database, so we just use the latest minor version available for Postgres.

### Embedding Indexes

Indexes are used to optimize semantic search queries. Indexes for embeddings are a special type of indexes mainly implementing semantic search. So, basically the indexes are used to `LIMIT` the search space of the embeddings table to the top, for example 10, most relevant embeddings to the query embedding.

The indexes used are of type `HNSW` and are partial indexes. The partial indexes are used to limit the search space to the embeddings for a specific project-embedding model.

This way, you can easily end-up with 10.000 indexes in the same table, which we don't want to :)

In Gendox we are proposing to create a new partial index only for projects that have more than 10.000 embeddings. For the rest of the projects, we are using the default sequential scan.

You can create a new partial index using the following SQL query:

```sql
CREATE INDEX hnsw_l2_idx_proj_12345678_9abcd_443c_1234_123456789abc
    ON gendox_core.embedding_clone
        USING hnsw (embedding_vector vector_l2_ops)
    WITH (
    m = 16, -- Max number of connections per node (default: 16)
    ef_construction = 64 -- Size of the dynamic candidate list for constructing the graph (default: 64)
    )
    WHERE project_id = '12345678_9abcd_443c_1234_123456789abc'  -- project id
              and section_id is not null                        -- semantic search is applied only in sections of documents uploaded
              and semantic_search_model_id = '[model-id]';      -- the id of model eg OpenAI text-embeddigns-3, etc
```