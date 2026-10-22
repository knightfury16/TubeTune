const { test, expect } = require('./support/fixtures');
const yt = require('./support/youtube');

const isVisible = (page) => yt.heading(page).then((h) => h.visible);

test.describe('hide state', () => {
    test('#1 after a reload, one press of the shortcut toggles the title', async ({ page, ext }) => {
        await yt.openVideo(page, yt.VIDEOS.zoo);
        await ext.command('hide');
        await expect.poll(() => isVisible(page)).toBe(false);

        await yt.reloadVideo(page);
        const before = await isVisible(page);
        expect(await ext.badge(page)).toBe(before ? 'Off' : 'On');

        await ext.command('hide');
        await expect.poll(() => isVisible(page)).toBe(!before);
    });

    test('#2 every tab shares the hide mode and stays in sync', async ({ context, page, ext }) => {
        await yt.openVideo(page, yt.VIDEOS.zoo);
        await ext.command('hide');
        await expect.poll(() => isVisible(page)).toBe(false);

        const second = await context.newPage();
        await yt.openVideo(second, yt.VIDEOS.rick);
        expect(await isVisible(second)).toBe(false);

        await second.bringToFront();
        await ext.command('hide');
        await expect.poll(() => isVisible(second)).toBe(true);
        await expect.poll(() => isVisible(page)).toBe(true);
    });

    test('two quick presses of the shortcut cancel out', async ({ page, ext }) => {
        await yt.openVideo(page, yt.VIDEOS.zoo);

        await ext.evaluate(() => {
            const press = () => self.__tt.commandListeners.forEach((fn) => fn('hide'));
            press();
            press();
        });
        await yt.settle(page);

        expect(await isVisible(page)).toBe(true);
        expect(await ext.badge(page)).toBe('Off');
    });

    test('#3 hide state survives the service worker being restarted', async ({ page, ext }) => {
        await yt.openVideo(page, yt.VIDEOS.zoo);
        await ext.command('hide');
        await expect.poll(() => isVisible(page)).toBe(false);

        await ext.restartServiceWorker();

        await ext.command('hide');
        await expect.poll(() => isVisible(page)).toBe(true);
    });

    test('#4 a video loading in a background tab does not change the active tab badge', async ({ page, ext }) => {
        await yt.openVideo(page, yt.VIDEOS.zoo);
        await ext.command('hide');
        await expect.poll(() => ext.badge(page)).toBe('On');

        const background = await ext.openInBackgroundTab(`https://www.youtube.com/watch?v=${yt.VIDEOS.rick}`);
        await background.waitForSelector(yt.HEADING, { state: 'attached', timeout: 45_000 });
        await yt.settle(background);
        await yt.settle(background);

        expect(await ext.badge(page)).toBe('On');
    });

    test('#10 a hidden title is still hidden after reloading the page', async ({ page, ext }) => {
        await yt.openVideo(page, yt.VIDEOS.zoo);
        await ext.command('hide');
        await expect.poll(() => isVisible(page)).toBe(false);

        await yt.reloadVideo(page);

        expect(await isVisible(page)).toBe(false);
    });
});

test.describe('fresh install', () => {
    test.use({ initialHideState: null });

    test('#10 titles are removed automatically on the first video you open', async ({ page, ext }) => {
        await yt.openVideo(page, yt.VIDEOS.zoo);

        expect(await isVisible(page)).toBe(false);
        expect((await yt.heading(page)).tabTitle).toMatch(/^youtube$/i);
        expect(await ext.badge(page)).toBe('On');
    });
});
