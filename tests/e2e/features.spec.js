const { test, expect } = require('./support/fixtures');
const yt = require('./support/youtube');

test.use({ initialHideState: true });

const visibilityOf = (page, selector) => page.evaluate((s) => {
    const els = [...document.querySelectorAll(s)];
    return els.length ? [...new Set(els.map((el) => getComputedStyle(el).visibility))] : null;
}, selector);

// What the browser's media controls actually received, bypassing any page-side wrapper.
const mediaSessionTitle = (page) => page.evaluate(() => Object.getOwnPropertyDescriptor(MediaSession.prototype, 'metadata')
    .get.call(navigator.mediaSession)?.title ?? null);

test.describe('everywhere a title can appear', () => {
    test('miniplayer title is hidden, and shown again with the shortcut', async ({ page, ext }) => {
        await yt.openVideo(page, yt.VIDEOS.zoo);
        await page.locator('#movie_player').click();
        await page.keyboard.press('i');
        await page.locator('.ytdMiniplayerInfoBarTitle').waitFor({ state: 'attached', timeout: 15_000 });

        expect(await visibilityOf(page, '.ytdMiniplayerInfoBarTitle')).toEqual(['hidden']);

        await ext.command('hide');
        await expect.poll(() => visibilityOf(page, '.ytdMiniplayerInfoBarTitle')).toEqual(['visible']);
    });

    test('fullscreen title overlay is hidden', async ({ page }) => {
        await yt.openVideo(page, yt.VIDEOS.zoo);
        const selector = '.ytp-fullscreen-metadata .ytPlayerOverlayVideoDetailsRendererTitle';
        test.skip(await page.locator(selector).count() === 0, 'this player version has no fullscreen overlay title');

        expect(await visibilityOf(page, selector)).toEqual(['hidden']);
    });

    test('title at the top of the expanded description is hidden', async ({ page }) => {
        await yt.openVideo(page, yt.VIDEOS.zoo);
        const selector = 'yt-video-title-header-view-model, ytd-video-description-header-renderer #title';
        test.skip(await page.locator(selector).count() === 0, 'this layout has no description title header');

        expect(await visibilityOf(page, selector)).toEqual(['hidden']);
    });

    test('media controls get "YouTube" instead of the title', async ({ page, ext }) => {
        await yt.openVideo(page, yt.VIDEOS.zoo);
        const real = await yt.realTitle(page);
        await expect.poll(() => page.evaluate(() => navigator.mediaSession.metadata?.title ?? null)).not.toBeNull();

        expect(await mediaSessionTitle(page)).toBe('YouTube');

        await ext.command('hide');
        await expect.poll(() => mediaSessionTitle(page)).toBe(real);
    });

    test('Shorts title and tab title are hidden', async ({ page }) => {
        await page.goto('https://www.youtube.com/shorts', { waitUntil: 'domcontentloaded' });
        await page.waitForURL(/\/shorts\/.+/, { timeout: 45_000 });
        await page.locator('yt-shorts-video-title-view-model').first().waitFor({ state: 'attached', timeout: 45_000 });
        await yt.settle(page);

        expect(await visibilityOf(page, 'yt-shorts-video-title-view-model')).toEqual(['hidden']);
        expect(await page.title()).toBe('YouTube');
    });

    test('the title never flashes while a hidden video page reloads', async ({ page }) => {
        await yt.openVideo(page, yt.VIDEOS.zoo);
        await page.addInitScript((selector) => {
            window.__ttFlashes = [];
            const check = () => {
                const el = document.querySelector(selector);
                if (el && el.checkVisibility() && el.textContent.trim()) window.__ttFlashes.push(el.textContent.trim());
                requestAnimationFrame(check);
            };
            requestAnimationFrame(check);
        }, yt.HEADING);

        await yt.reloadVideo(page);

        expect(await page.evaluate(() => [...new Set(window.__ttFlashes)])).toEqual([]);
    });
});
