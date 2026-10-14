// YouTube page helpers. Ground truth for "the real title" comes from YouTube's
// own player API, never from anything the extension may have rewritten.

const VIDEOS = {
    zoo: 'jNQXAC9IVRw', // "Me at the zoo"
    rick: 'dQw4w9WgXcQ',
};

// The heading as the user sees it: YouTube's text, or a custom title in its place.
const HEADING = 'ytd-watch-metadata #title h1';

// Time for the content script to finish its own startup or navigation handling.
const SETTLE_MS = 2500;

async function dismissConsent(page) {
    if (!page.url().includes('consent.')) return;
    await page.getByRole('button', { name: /reject all/i }).first().click();
    await page.waitForURL(/youtube\.com\/(?!.*consent)/);
}

async function waitForWatchReady(page, videoId) {
    await page.waitForFunction((id) => {
        const player = document.getElementById('movie_player');
        const heading = document.querySelector('ytd-watch-metadata #title h1 yt-formatted-string');
        return player?.getVideoData?.().video_id === id && heading?.textContent.trim();
    }, videoId, { timeout: 45_000 });
    await page.waitForTimeout(SETTLE_MS);
}

async function openVideo(page, videoId) {
    await page.goto(`https://www.youtube.com/watch?v=${videoId}`, { waitUntil: 'domcontentloaded' });
    await dismissConsent(page);
    await waitForWatchReady(page, videoId);
}

async function reloadVideo(page) {
    const videoId = new URL(page.url()).searchParams.get('v');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForWatchReady(page, videoId);
}

async function openSearch(page, query) {
    await page.goto(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded' });
    await dismissConsent(page);
    await page.locator('ytd-video-renderer a#video-title').first().waitFor({ timeout: 45_000 });
    await page.waitForTimeout(SETTLE_MS);
}

// In-page (SPA) navigation by clicking a video link, the way a user would.
async function clickVideoLink(page, selector) {
    // Skip links back to the current video (e.g. a Mix of it), which do not navigate.
    const current = new URL(page.url()).searchParams.get('v');
    const others = current ? `${selector}:not([href*="v=${current}"])` : selector;
    const link = page.locator(others).filter({ visible: true }).first();
    await link.waitFor({ timeout: 45_000 });
    const href = await link.getAttribute('href');
    const videoId = new URL(href, 'https://www.youtube.com').searchParams.get('v');
    await link.click();
    await waitForWatchReady(page, videoId);
    return videoId;
}

const clickFirstSearchResult = (page) => clickVideoLink(page, 'ytd-video-renderer a#video-title');
const clickFirstRelated = (page) => clickVideoLink(page, '#related a[href*="/watch?v="]');

async function realTitle(page) {
    return page.evaluate(() => document.getElementById('movie_player').getVideoData().title);
}

async function heading(page) {
    return page.evaluate((selector) => {
        const el = document.querySelector(selector);
        return {
            visible: el ? el.checkVisibility() : false,
            text: el ? el.innerText.trim() : null,
            tabTitle: document.title,
        };
    }, HEADING);
}

// Records whether the heading is ever visible with text, checked every frame.
async function startFlashWatch(page) {
    await page.evaluate((selector) => {
        window.__ttFlashes = [];
        const check = () => {
            const el = document.querySelector(selector);
            if (el && el.checkVisibility() && el.textContent.trim()) {
                window.__ttFlashes.push(el.textContent.trim());
            }
            window.__ttFlashFrame = requestAnimationFrame(check);
        };
        check();
    }, HEADING);
}

async function stopFlashWatch(page) {
    return page.evaluate(() => {
        cancelAnimationFrame(window.__ttFlashFrame);
        return [...new Set(window.__ttFlashes)];
    });
}

const settle = (page) => page.waitForTimeout(SETTLE_MS);

module.exports = {
    VIDEOS, HEADING, waitForWatchReady, openVideo, reloadVideo, openSearch, clickFirstSearchResult,
    clickFirstRelated, realTitle, heading, startFlashWatch, stopFlashWatch, settle,
};
