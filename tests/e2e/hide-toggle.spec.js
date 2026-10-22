const { test, expect } = require('./support/fixtures');
const yt = require('./support/youtube');

test.describe('hide / show on a watch page', () => {
    test('hide then show toggles the heading, tab title and badge', async ({ page, ext }) => {
        await yt.openVideo(page, yt.VIDEOS.zoo);

        await ext.command('hide');
        await expect.poll(() => yt.heading(page).then((h) => h.visible)).toBe(false);
        expect((await yt.heading(page)).tabTitle).toMatch(/^youtube$/i);
        await expect.poll(() => ext.badge(page)).toBe('On');

        await ext.command('hide');
        await expect.poll(() => yt.heading(page).then((h) => h.visible)).toBe(true);
        await expect.poll(() => ext.badge(page)).toBe('Off');
    });

    test('#7 show restores the original tab title exactly', async ({ page, ext }) => {
        await yt.openVideo(page, yt.VIDEOS.zoo);
        const original = `${await yt.realTitle(page)} - YouTube`;

        await ext.command('hide');
        await expect.poll(() => yt.heading(page).then((h) => h.visible)).toBe(false);
        await ext.command('hide');
        await expect.poll(() => yt.heading(page).then((h) => h.visible)).toBe(true);

        expect(await page.title()).toBe(original);
    });

    test('hiding also hides the title overlay on the player (fullscreen)', async ({ page, ext }) => {
        await yt.openVideo(page, yt.VIDEOS.zoo);
        const overlayTitle = page.locator('#movie_player .ytp-title');

        await ext.command('hide');
        await expect.poll(() => yt.heading(page).then((h) => h.visible)).toBe(false);
        expect(await overlayTitle.evaluate((el) => getComputedStyle(el).visibility)).toBe('hidden');

        await ext.command('hide');
        await expect.poll(() => yt.heading(page).then((h) => h.visible)).toBe(true);
        expect(await overlayTitle.evaluate((el) => getComputedStyle(el).visibility)).toBe('visible');
    });

    test('#6 the shortcut on a non-video YouTube page switches the mode cleanly', async ({ page, ext }) => {
        await yt.openSearch(page, 'me at the zoo');
        const searchTitle = await page.title();

        await ext.command('hide');
        await expect.poll(() => ext.badge(page)).toBe('On');
        expect(await page.title()).toBe(searchTitle);

        // The next video opens hidden, and one press shows it again.
        await yt.openVideo(page, yt.VIDEOS.zoo);
        expect((await yt.heading(page)).visible).toBe(false);
        await ext.command('hide');
        await expect.poll(() => yt.heading(page).then((h) => h.visible)).toBe(true);
        await expect.poll(() => ext.badge(page)).toBe('Off');
    });

    test('the shortcut does nothing outside YouTube', async ({ page, ext }) => {
        await page.goto('about:blank');

        await ext.command('hide');
        await page.waitForTimeout(1000);

        expect(await ext.badge(page)).toBe('Off');
    });
});
