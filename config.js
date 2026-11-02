
/* =========================================================
   CINEVA — SUPABASE CONFIGURATION
   File: js/config.js
   ========================================================= */

/* =========================
   01. SUPABASE SETTINGS
========================= */

const SUPABASE_CONFIG = {
    URL: "YOUR_SUPABASE_PROJECT_URL",

    ANON_KEY: "YOUR_SUPABASE_ANON_PUBLIC_KEY"
};


/* =========================
   02. DATABASE TABLES
========================= */

const DATABASE_TABLES = {
    MOVIES: "movies",
    SERIES: "series",
    EPISODES: "episodes",
    COMMENTS: "comments"
};


/* =========================
   03. SUPABASE CLIENT
========================= */

// Load Supabase JS library before this config.js file.
// This client uses the public anon key.
// Never place your service_role key in frontend code.

if (!window.supabase) {
    console.error(
        "CINEVA ERROR: Supabase library has not been loaded."
    );
}

if (
    !SUPABASE_CONFIG.URL ||
    !SUPABASE_CONFIG.ANON_KEY ||
    SUPABASE_CONFIG.URL.includes("YOUR_SUPABASE") ||
    SUPABASE_CONFIG.ANON_KEY.includes("YOUR_SUPABASE")
) {
    console.error(
        "CINEVA ERROR: Add your Supabase URL and anon key in config.js."
    );
}

const cinevaSupabase =
    window.supabase &&
    !SUPABASE_CONFIG.URL.includes("YOUR_SUPABASE") &&
    !SUPABASE_CONFIG.ANON_KEY.includes("YOUR_SUPABASE")
        ? window.supabase.createClient(
            SUPABASE_CONFIG.URL,
            SUPABASE_CONFIG.ANON_KEY
        )
        : null;


/* =========================
   04. APP CONFIGURATION
========================= */

const CINEVA_CONFIG = {
    NAME: "CINEVA",

    VERSION: "1.0.0",

    CONTENT_LIMIT: 12,

    HERO_LIMIT: 5,

    TRENDING_LIMIT: 12,

    DEFAULT_QUALITY: "HD",

    PLACEHOLDER_IMAGE:
        "assets/images/placeholder.jpg"
};


/* =========================
   05. DATABASE HELPERS
========================= */

const CinevaDB = {

    client: cinevaSupabase,

    async getMovies(options = {}) {

        if (!this.client) {
            throw new Error("Supabase is not connected.");
        }

        let query = this.client
            .from(DATABASE_TABLES.MOVIES)
            .select("*")
            .order("created_at", { ascending: false });

        if (options.category) {
            query = query.eq("category", options.category);
        }

        if (options.limit) {
            query = query.limit(options.limit);
        }

        if (options.featured !== undefined) {
            query = query.eq("featured", options.featured);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data || [];
    },


    async getSeries(options = {}) {

        if (!this.client) {
            throw new Error("Supabase is not connected.");
        }

        let query = this.client
            .from(DATABASE_TABLES.SERIES)
            .select("*")
            .order("created_at", { ascending: false });

        if (options.category) {
            query = query.eq("category", options.category);
        }

        if (options.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data || [];
    },


    async getEpisodes(seriesId) {

        if (!this.client) {
            throw new Error("Supabase is not connected.");
        }

        const { data, error } = await this.client
            .from(DATABASE_TABLES.EPISODES)
            .select("*")
            .eq("series_id", seriesId)
            .order("season_number", { ascending: true })
            .order("episode_number", { ascending: true });

        if (error) throw error;

        return data || [];
    },


    async searchContent(searchTerm) {

        if (!this.client) {
            throw new Error("Supabase is not connected.");
        }

        const term = searchTerm.trim();

        if (!term) return [];

        const [moviesResult, seriesResult] = await Promise.all([

            this.client
                .from(DATABASE_TABLES.MOVIES)
                .select("*")
                .ilike("title", `%${term}%`)
                .limit(10),

            this.client
                .from(DATABASE_TABLES.SERIES)
                .select("*")
                .ilike("title", `%${term}%`)
                .limit(10)

        ]);

        if (moviesResult.error) throw moviesResult.error;
        if (seriesResult.error) throw seriesResult.error;

        return [
            ...(moviesResult.data || []),
            ...(seriesResult.data || [])
        ];
    }

};


/* =========================
   06. CONNECTION TEST
========================= */

async function testCinevaConnection() {

    if (!CinevaDB.client) {
        console.warn("CINEVA: Supabase credentials are missing.");
        return false;
    }

    try {

        const { error } = await CinevaDB.client
            .from(DATABASE_TABLES.MOVIES)
            .select("id")
            .limit(1);

        if (error) throw error;

        console.log(
            "%c CINEVA CONNECTED SUCCESSFULLY ",
            "background:#1677ff;color:white;padding:8px;"
        );

        return true;

    } catch (error) {

        console.error(
            "CINEVA SUPABASE ERROR:",
            error.message
        );

        return false;
    }
}

console.log("CINEVA configuration loaded.");
