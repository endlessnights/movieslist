export async function onRequestGet(context) {
    try {
        const { results } = await context.env.DB
            .prepare(`
                SELECT
                    id,
                    title,
                    year,
                    type,
                    watched,
                    created_at AS createdAt
                FROM movies
                ORDER BY created_at DESC
            `)
            .all();

        const movies = results.map(movie => ({
            ...movie,
            watched: Boolean(movie.watched)
        }));

        return Response.json(movies);

    } catch (error) {
        console.error(error);

        return Response.json(
            {
                error: "Failed to load watchlist",
                details: error.message
            },
            { status: 500 }
        );
    }
}