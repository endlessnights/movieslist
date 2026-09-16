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
                    created_at AS createdAt,
                    watched_at AS watchedAt
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


export async function onRequestPost(context) {
    try {
        const body = await context.request.json();

        const title = body.title?.trim();
        const year = body.year ?? null;
        const type = body.type ?? "unknown";

        if (!title) {
            return Response.json(
                { error: "Title is required" },
                { status: 400 }
            );
        }

        if (!["movie", "series", "unknown"].includes(type)) {
            return Response.json(
                { error: "Invalid type" },
                { status: 400 }
            );
        }

        const id = crypto.randomUUID();

        await context.env.DB
            .prepare(`
                INSERT INTO movies (
                    id,
                    title,
                    year,
                    type,
                    watched,
                    watched_at
                )
                VALUES (?, ?, ?, ?, 0, NULL)
            `)
            .bind(id, title, year, type)
            .run();

        return Response.json(
            {
                id,
                title,
                year,
                type,
                watched: false,
                watchedAt: null
            },
            { status: 201 }
        );

    } catch (error) {
        console.error(error);

        return Response.json(
            {
                error: "Failed to add movie",
                details: error.message
            },
            { status: 500 }
        );
    }
}


export async function onRequestPatch(context) {
    try {
        const body = await context.request.json();

        const id = body.id;
        const watched = body.watched;

        if (!id || typeof watched !== "boolean") {
            return Response.json(
                { error: "id and watched boolean are required" },
                { status: 400 }
            );
        }

        const watchedAt = watched
            ? new Date().toISOString()
            : null;

        const result = await context.env.DB
            .prepare(`
                UPDATE movies
                SET
                    watched = ?,
                    watched_at = ?
                WHERE id = ?
            `)
            .bind(
                watched ? 1 : 0,
                watchedAt,
                id
            )
            .run();

        if (result.meta.changes === 0) {
            return Response.json(
                { error: "Movie not found" },
                { status: 404 }
            );
        }

        return Response.json({
            success: true,
            id,
            watched,
            watchedAt
        });

    } catch (error) {
        console.error(error);

        return Response.json(
            {
                error: "Failed to update movie",
                details: error.message
            },
            { status: 500 }
        );
    }
}
