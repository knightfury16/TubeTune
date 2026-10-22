const { test, expect } = require('./support/fixtures');
const yt = require('./support/youtube');

test.describe('in-page navigation', () => {
    test('starting on search results, hiding works and follows in-page navigation', async ({ page, ext }) => {
        await yt.openSearch(page, 'me at the zoo');
        await yt.clickFirstSearchResult(page);

        await ext.command('hide');
        await expect.poll(() => yt.heading(page).then((h) => h.visible)).toBe(false);

        await yt.clickFirstRelated(page);
        expect((await yt.heading(page)).visible).toBe(false);
    });

    test('a video opened in a background tab works once you switch to it', async ({ page, ext }) => {
        await yt.openVideo(page, yt.VIDEOS.zoo);
        const later = await ext.openInBackgroundTab(`https://www.youtube.com/watch?v=${yt.VIDEOS.rick}`);
        // Long enough for the content script's startup retries to run out.
        await later.waitForTimeout(10_000);

        await later.bringToFront();
        await yt.waitForWatchReady(later, yt.VIDEOS.rick);
        await ext.command('hide');
        await expect.poll(() => yt.heading(later).then((h) => h.visible)).toBe(false);

        await yt.clickFirstRelated(later);
        expect((await yt.heading(later)).tabTitle).toMatch(/^youtube$/i);
    });

    test('a custom title is dropped when you move to another video', async ({ page, ext }) => {
        await yt.openVideo(page, yt.VIDEOS.zoo);
        const popup = await ext.openPopup();
        await popup.fill('#newTitle', 'Only for this video');
        await popup.press('#newTitle', 'Enter');
        await expect.poll(() => yt.heading(page).then((h) => h.text)).toBe('Only for this video');

        await yt.clickFirstRelated(page);

        const expected = await yt.realTitle(page);
        expect(await yt.heading(page)).toMatchObject({ text: expected, tabTitle: `${expected} - YouTube` });
    });

    test('#8 heading shows the new video title after clicking a related video', async ({ page }) => {
        await yt.openVideo(page, yt.VIDEOS.zoo);
        await yt.clickFirstRelated(page);

        const expected = await yt.realTitle(page);
        expect((await yt.heading(page)).text).toBe(expected);
    });

    test('#9 a hidden title stays hidden through in-page navigation', async ({ page, ext }) => {
        await yt.openVideo(page, yt.VIDEOS.zoo);
        await ext.command('hide');
        await expect.poll(() => yt.heading(page).then((h) => h.visible)).toBe(false);

        await yt.startFlashWatch(page);
        await yt.clickFirstRelated(page);
        const flashes = await yt.stopFlashWatch(page);

        expect(flashes, 'heading was visible during navigation').toEqual([]);
        const after = await yt.heading(page);
        expect(after.visible).toBe(false);
        expect(after.tabTitle).toMatch(/^youtube$/i);
    });
});
