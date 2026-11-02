
/* =========================================================
   CINEVA — MAIN APPLICATION
   File: js/script.js
   ========================================================= */

"use strict";

/* =========================================================
   01. GLOBAL SETTINGS
========================================================= */

const CINEVA = {
    hero: [],
    allContent: [],
    myList: JSON.parse(localStorage.getItem("cineva_my_list") || "[]"),
    currentHero: 0,
    heroTimer: null,
    searchTimer: null
};

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => document.querySelectorAll(selector);


/* =========================================================
   02. INITIALIZE APPLICATION
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    updateYear();

    initializeNavigation();

    initializeSearch();

    initializeBackToTop();

    initializeHeroControls();

    initializeMyList();

    await loadHomepageContent();

    hidePageLoader();

});


/* =========================================================
   03. PAGE LOADER
========================================================= */

function hidePageLoader() {

    const loader = $("#page-loader");

    if (!loader) return;

    loader.classList.add("hidden");

    setTimeout(() => {
        loader.style.display = "none";
    }, 600);

}


/* =========================================================
   04. NAVIGATION
========================================================= */

function initializeNavigation() {

    const menuButton = $("#menu-toggle");
    const navigation = $("#main-nav");
    const navbar = $("#navbar");

    if (menuButton && navigation) {

        menuButton.addEventListener("click", () => {

            navigation.classList.toggle("active");

            const icon = menuButton.querySelector("i");

            if (icon) {
                icon.className = navigation.classList.contains("active")
                    ? "fa-solid fa-xmark"
                    : "fa-solid fa-bars";
            }

        });

        navigation.querySelectorAll("a").forEach(link => {

            link.addEventListener("click", () => {

                navigation.classList.remove("active");

                const icon = menuButton.querySelector("i");

                if (icon) {
                    icon.className = "fa-solid fa-bars";
                }

            });

        });

    }

    window.addEventListener("scroll", () => {

        if (navbar) {
            navbar.classList.toggle("scrolled", window.scrollY > 50);
        }

    });

}


/* =========================================================
   05. SUPABASE CONNECTION CHECK
========================================================= */

function getDatabase() {

    if (typeof CinevaDB === "undefined" || !CinevaDB.client) {
        console.error("CINEVA: Supabase is not configured.");
        return null;
    }

    return CinevaDB;

}


/* =========================================================
   06. LOAD HOMEPAGE CONTENT
========================================================= */

async function loadHomepageContent() {

    const db = getDatabase();

    if (!db) {

        showDatabaseError();

        return;

    }

    try {

        const [
            movies,
            series
        ] = await Promise.all([

            db.getMovies(),

            db.getSeries()

        ]);

        const allMovies = normalizeContent(movies, "movie");

        const allSeries = normalizeContent(series, "series");

        CINEVA.allContent = [
            ...allMovies,
            ...allSeries
        ];

        CINEVA.allContent.sort((a, b) => {
            return new Date(b.created_at || 0) -
                   new Date(a.created_at || 0);
        });

        renderLatest(CINEVA.allContent);

        renderTrending(CINEVA.allContent);

        renderCategory("Action", "action-movies");

        renderCategory("Horror", "horror-movies");

        renderCategory("Erotic", "erotic-movies");

        renderCategory("Drama", "drama-movies");

        renderCategory("Highschool", "highschool-movies");

        renderCategory("Animation", "animation-movies");

        renderCategory("Comedy", "comedy-movies");

        renderLatestSeries(allSeries);

        initializeHero(CINEVA.allContent);

    } catch (error) {

        console.error("CINEVA homepage error:", error);

        showDatabaseError();

    }

}


/* =========================================================
   07. NORMALIZE DATABASE CONTENT
========================================================= */

function normalizeContent(items, type) {

    return (items || [])
        .filter(item => item.is_active !== false)
        .map(item => ({

            ...item,

            content_type: type,

            poster: item.poster_url ||
                    item.poster ||
                    item.poster_path ||
                    item.image ||
                    item.thumbnail ||
                    "",

            backdrop: item.banner_url ||
                      item.banner ||
                      item.backdrop_url ||
                      item.backdrop ||
                      item.poster_url ||
                      item.poster ||
                      "",

            rating: item.rating || item.vote_average || "",

            year: item.release_year ||
                  item.year ||
                  (
                    item.release_date
                        ? String(item.release_date).substring(0, 4)
                        : ""
                  )

        }));

}


/* =========================================================
   08. IMAGE HANDLING
========================================================= */

function getPoster(item) {

    return item.poster || CINEVA_CONFIG.PLACEHOLDER_IMAGE;

}

function getBackdrop(item) {

    return item.backdrop || getPoster(item);

}

function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, character => ({

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"

    })[character]);

}


/* =========================================================
   09. CREATE MOVIE CARD
========================================================= */

function createMovieCard(item) {

    const id = escapeHTML(item.id);

    const title = escapeHTML(item.title || "Untitled");

    const poster = escapeHTML(getPoster(item));

    const year = escapeHTML(item.year || "New");

    const rating = Number(item.rating);

    const quality = escapeHTML(
        item.quality || CINEVA_CONFIG.DEFAULT_QUALITY
    );

    const type = item.content_type === "series" ? "SERIES" : "MOVIE";

    const isSaved = CINEVA.myList.some(saved => {
        return String(saved.id) === String(item.id);
    });

    return `

        <article class="movie-card" data-id="${id}">

            <div class="movie-poster">

                <img
                    src="${poster}"
                    alt="${title}"
                    loading="lazy"
                    onerror="this.onerror=null;this.src='${CINEVA_CONFIG.PLACEHOLDER_IMAGE}'"
                >

                <span class="movie-quality">${quality}</span>

                <span class="movie-type">${type}</span>

                <span class="movie-year">${year}</span>

                ${rating > 0 ? `
                    <span class="movie-rating">
                        <i class="fa-solid fa-star"></i>
                        ${rating.toFixed(1)}
                    </span>
                ` : ""}

                <div class="movie-overlay">

                    <button
                        type="button"
                        aria-label="Watch ${title}"
                        onclick="openContent('${id}')"
                    >
                        <i class="fa-solid fa-play"></i>
                    </button>

                    <button
                        type="button"
                        aria-label="Add ${title} to my list"
                        onclick="toggleMyList('${id}')"
                    >
                        <i class="${isSaved
                            ? "fa-solid"
                            : "fa-regular"
                        } fa-bookmark"></i>
                    </button>

                </div>

            </div>

            <div class="movie-info">

                <h3 title="${title}">${title}</h3>

                <p>
                    ${year} 
                    <span>•</span>
                    ${type}
                </p>

            </div>

        </article>

    `;

}


/* =========================================================
   10. RENDER MOVIE COLLECTION
========================================================= */

function renderCollection(elementId, items, limit = 12) {

    const container = document.getElementById(elementId);

    if (!container) return;

    const content = (items || []).slice(0, limit);

    if (!content.length) {

        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-film"></i>
                <h3>Coming Soon</h3>
                <p>New entertainment is being prepared.</p>
            </div>
        `;

        return;

    }

    container.innerHTML = content.map(createMovieCard).join("");

}


/* =========================================================
   11. LATEST ADDED
========================================================= */

function renderLatest(content) {

    const latest = [...content].sort((a, b) => {
        return new Date(b.created_at || 0) -
               new Date(a.created_at || 0);
    });

    renderCollection(
        "latest-movies",
        latest,
        12
    );

}


/* =========================================================
   12. TRENDING NOW
========================================================= */

function renderTrending(content) {

    const trending = [...content].sort((a, b) => {

        const viewsA = Number(a.views || 0);

        const viewsB = Number(b.views || 0);

        const likesA = Number(a.likes || 0);

        const likesB = Number(b.likes || 0);

        return (viewsB + likesB * 3) -
               (viewsA + likesA * 3);

    });

    renderCollection(
        "trending-movies",
        trending,
        12
    );

}


/* =========================================================
   13. CATEGORY COLLECTIONS
========================================================= */

function renderCategory(category, elementId) {

    const items = CINEVA.allContent.filter(item => {

        const itemCategory = String(item.category || "")
            .trim()
            .toLowerCase();

        return itemCategory === category.toLowerCase();

    });

    renderCollection(elementId, items, 15);

}


/* =========================================================
   14. LATEST SERIES
========================================================= */

function renderLatestSeries(series) {

    const sorted = [...series].sort((a, b) => {

        const dateA = new Date(
            a.updated_at || a.created_at || 0
        );

        const dateB = new Date(
            b.updated_at || b.created_at || 0
        );

        return dateB - dateA;

    });

    renderCollection(
        "series-movies",
        sorted,
        15
    );

}


/* =========================================================
   15. HERO SLIDER
========================================================= */

function initializeHero(content) {

    const featured = content
        .filter(item => item.featured === true)
        .sort((a, b) => {

            return Number(a.featured_order || 999) -
                   Number(b.featured_order || 999);

        });

    const latest = [...content].sort((a, b) => {

        return new Date(b.created_at || 0) -
               new Date(a.created_at || 0);

    });

    CINEVA.hero = [
        ...featured,
        ...latest.filter(item => {

            return !featured.some(feature => {
                return String(feature.id) === String(item.id);
            });

        })
    ].slice(0, CINEVA_CONFIG.HERO_LIMIT);

    if (!CINEVA.hero.length) {

        showDefaultHero();

        return;

    }

    CINEVA.currentHero = 0;

    renderHero(0);

    startHeroAutoplay();

}


function renderHero(index) {

    const item = CINEVA.hero[index];

    if (!item) return;

    const backdrop = $("#hero-backdrop");

    const title = $("#hero-title");

    const category = $("#hero-category");

    const description = $("#hero-description");

    const year = $("#hero-year");

    const type = $("#hero-type");

    const quality = $("#hero-quality");

    const rating = $("#hero-rating");

    const watch = $("#hero-watch");

    const details = $("#hero-details");

    const add = $("#hero-add");

    const progress = $("#hero-progress-bar");

    const count = $("#hero-count");

    if (backdrop) {

        backdrop.style.backgroundImage =
            `url("${getBackdrop(item)}")`;

    }

    if (title) {

        title.innerHTML = escapeHTML(item.title || "Untitled");

    }

    if (category) {

        category.textContent = String(
            item.category || "FEATURED CONTENT"
        ).toUpperCase();

    }

    if (description) {

        description.textContent =
            item.description ||
            item.overview ||
            "Discover incredible entertainment with CINEVA.";

    }

    if (year) year.textContent = item.year || "New";

    if (type) {

        type.textContent =
            item.content_type === "series" ? "TV Series" : "Movie";

    }

    if (quality) {

        quality.textContent =
            item.quality || CINEVA_CONFIG.DEFAULT_QUALITY;

    }

    if (rating) {

        const score = Number(item.rating);

        rating.innerHTML = score > 0
            ? `<i class="fa-solid fa-star"></i> ${score.toFixed(1)}`
            : "";

    }

    const id = encodeURIComponent(item.id);

    if (watch) {

        watch.href = `watch.html?id=${id}`;

    }

    if (details) {

        details.href = `watch.html?id=${id}`;

    }

    if (add) {

        const saved = CINEVA.myList.some(movie => {
            return String(movie.id) === String(item.id);
        });

        add.innerHTML = saved
            ? '<i class="fa-solid fa-bookmark"></i> Saved'
            : '<i class="fa-regular fa-bookmark"></i> My List';

        add.onclick = () => toggleMyList(item.id);

    }

    if (progress) {

        progress.style.width =
            `${((index + 1) / CINEVA.hero.length) * 100}%`;

    }

    if (count) {

        count.innerHTML = `
            ${String(index + 1).padStart(2, "0")}
            <span>/ ${String(CINEVA.hero.length).padStart(2, "0")}</span>
        `;

    }

}


function showDefaultHero() {

    const title = $("#hero-title");

    if (title) {
        title.innerHTML = "Discover Your <span>Next Story.</span>";
    }

}


/* =========================================================
   16. HERO CONTROLS
========================================================= */

function initializeHeroControls() {

    const previous = $("#hero-prev");

    const next = $("#hero-next");

    if (previous) {

        previous.addEventListener("click", () => {

            changeHero(-1);

        });

    }

    if (next) {

        next.addEventListener("click", () => {

            changeHero(1);

        });

    }

}


function changeHero(direction) {

    if (!CINEVA.hero.length) return;

    CINEVA.currentHero = (
        CINEVA.currentHero +
        direction +
        CINEVA.hero.length
    ) % CINEVA.hero.length;

    renderHero(CINEVA.currentHero);

    startHeroAutoplay();

}


function startHeroAutoplay() {

    clearInterval(CINEVA.heroTimer);

    if (CINEVA.hero.length <= 1) return;

    CINEVA.heroTimer = setInterval(() => {

        changeHero(1);

    }, 7000);

}


/* =========================================================
   17. GLOBAL SEARCH
========================================================= */

function initializeSearch() {

    const toggle = $("#search-toggle");

    const panel = $("#search-panel");

    const close = $("#search-close");

    const input = $("#global-search");

    if (toggle && panel) {

        toggle.addEventListener("click", () => {

            panel.classList.toggle("active");

            if (panel.classList.contains("active") && input) {

                setTimeout(() => input.focus(), 200);

            }

        });

    }

    if (close && panel) {

        close.addEventListener("click", () => {

            panel.classList.remove("active");

        });

    }

    if (input) {

        input.addEventListener("input", () => {

            clearTimeout(CINEVA.searchTimer);

            CINEVA.searchTimer = setTimeout(() => {

                searchContent(input.value);

            }, 250);

        });

        input.addEventListener("keydown", event => {

            if (event.key === "Escape" && panel) {

                panel.classList.remove("active");

            }

        });

    }

}


async function searchContent(term) {

    const results = $("#search-results");

    if (!results) return;

    const searchTerm = term.trim();

    if (!searchTerm) {

        results.innerHTML = "";

        return;

    }

    const words = searchTerm.toLowerCase();

    const localResults = CINEVA.allContent.filter(item => {

        return String(item.title || "")
            .toLowerCase()
            .includes(words);

    });

    try {

        const db = getDatabase();

        const remoteResults = db
            ? await db.searchContent(searchTerm)
            : [];

        const combined = new Map();

        [...localResults, ...normalizeSearchResults(remoteResults)]
            .forEach(item => {

                combined.set(
                    `${item.content_type}-${item.id}`,
                    item
                );

            });

        const found = [...combined.values()].slice(0, 12);

        results.innerHTML = found.length
            ? found.map(createMovieCard).join("")
            : `
                <div class="empty-state">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <h3>No results found</h3>
                    <p>Try another movie or series title.</p>
                </div>
            `;

    } catch (error) {

        console.error("Search error:", error);

        results.innerHTML = `
            <div class="empty-state">
                <p>Unable to search right now.</p>
            </div>
        `;

    }

}


function normalizeSearchResults(items) {

    return (items || []).map(item => {

        const isSeries = CINEVA.allContent.some(existing => {

            return existing.content_type === "series" &&
                   String(existing.id) === String(item.id);

        });

        return normalizeContent(
            [item],
            isSeries ? "series" : "movie"
        )[0];

    });

}


/* =========================================================
   18. OPEN MOVIE / SERIES
========================================================= */

function openContent(id) {

    const item = CINEVA.allContent.find(content => {

        return String(content.id) === String(id);

    });

    if (!item) return;

    window.location.href =
        `watch.html?id=${encodeURIComponent(id)}`;

}


/* =========================================================
   19. MY LIST
========================================================= */

function initializeMyList() {

    updateMyListButtons();

}


function toggleMyList(id) {

    const item = CINEVA.allContent.find(content => {

        return String(content.id) === String(id);

    });

    if (!item) return;

    const exists = CINEVA.myList.some(saved => {

        return String(saved.id) === String(id);

    });

    if (exists) {

        CINEVA.myList = CINEVA.myList.filter(saved => {

            return String(saved.id) !== String(id);

        });

        showNotification("Removed from My List");

    } else {

        CINEVA.myList.push({

            id: item.id,

            title: item.title,

            poster: item.poster,

            content_type: item.content_type

        });

        showNotification("Added to My List");

    }

    localStorage.setItem(
        "cineva_my_list",
        JSON.stringify(CINEVA.myList)
    );

    updateMyListButtons();

    refreshVisibleCollections();

}


function updateMyListButtons() {

    const add = $("#hero-add");

    if (!add || !CINEVA.hero.length) return;

    const item = CINEVA.hero[CINEVA.currentHero];

    if (!item) return;

    const saved = CINEVA.myList.some(movie => {

        return String(movie.id) === String(item.id);

    });

    add.innerHTML = saved
        ? '<i class="fa-solid fa-bookmark"></i> Saved'
        : '<i class="fa-regular fa-bookmark"></i> My List';

}


function refreshVisibleCollections() {

    renderLatest(CINEVA.allContent);

    renderTrending(CINEVA.allContent);

    [
        ["Action", "action-movies"],
        ["Horror", "horror-movies"],
        ["Erotic", "erotic-movies"],
        ["Drama", "drama-movies"],
        ["Highschool", "highschool-movies"],
        ["Animation", "animation-movies"],
        ["Comedy", "comedy-movies"]
    ].forEach(([category, elementId]) => {

        renderCategory(category, elementId);

    });

    renderLatestSeries(
        CINEVA.allContent.filter(item => {
            return item.content_type === "series";
        })
    );

    if ($("#search-results")?.children.length) {

        const input = $("#global-search");

        if (input?.value.trim()) {

            searchContent(input.value);

        }

    }

}


/* =========================================================
   20. NOTIFICATIONS
========================================================= */

function showNotification(message) {

    let notification = $("#cineva-notification");

    if (!notification) {

        notification = document.createElement("div");

        notification.id = "cineva-notification";

        notification.style.cssText = `
            position:fixed;
            left:50%;
            bottom:30px;
            transform:translateX(-50%);
            z-index:99999;
            padding:13px 22px;
            background:#1677ff;
            color:white;
            font-size:13px;
            font-weight:700;
            border-radius:8px;
            box-shadow:0 8px 25px rgba(0,0,0,.3);
            opacity:0;
            transition:opacity .3s ease;
        `;

        document.body.appendChild(notification);

    }

    notification.textContent = message;

    notification.style.opacity = "1";

    clearTimeout(notification.hideTimer);

    notification.hideTimer = setTimeout(() => {

        notification.style.opacity = "0";

    }, 2200);

}


/* =========================================================
   21. BACK TO TOP
========================================================= */

function initializeBackToTop() {

    const button = $("#back-to-top");

    if (!button) return;

    window.addEventListener("scroll", () => {

        button.classList.toggle(
            "visible",
            window.scrollY > 500
        );

    });

    button.addEventListener("click", () => {

        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    });

}


/* =========================================================
   22. DATABASE ERROR
========================================================= */

function showDatabaseError() {

    const sections = [

        "latest-movies",
        "trending-movies",
        "action-movies",
        "horror-movies",
        "erotic-movies",
        "drama-movies",
        "highschool-movies",
        "animation-movies",
        "comedy-movies",
        "series-movies"

    ];

    sections.forEach(id => {

        const container = document.getElementById(id);

        if (!container) return;

        container.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-cloud-arrow-down"></i>

                <h3>Content unavailable</h3>

                <p>Please check your connection and try again.</p>

            </div>

        `;

    });

}


/* =========================================================
   23. UPDATE COPYRIGHT YEAR
========================================================= */

function updateYear() {

    const year = $("#current-year");

    if (year) {

        year.textContent = new Date().getFullYear();

    }

}

/* =========================================================
   24. GLOBAL FUNCTIONS
========================================================= */

window.openContent = openContent;

window.toggleMyList = toggleMyList;

window.CINEVA = CINEVA;

console.log(
    "%c CINEVA — Discover. Watch. Experience. ",
    "background:#1677ff;color:white;padding:10px;font-size:14px;font-weight:bold;"
);
