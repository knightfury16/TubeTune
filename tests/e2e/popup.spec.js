const { test, expect } = require('./support/fixtures');
const yt = require('./support/youtube');

test.describe('popup', () => {
    test('typing a title and clicking Modify replaces the heading', async ({ page, ext }) => {
        await yt.openVideo(page, yt.VIDEOS.zoo);

        const popup = await ext.openPopup();
        await popup.fill('#newTitle', 'My custom title');
        await popup.click('#modifyButton');

        await expect.poll(() => yt.heading(page).then((h) => h.text)).toBe('My custom title');
        expect((await yt.heading(page)).visible).toBe(true);
    });

    test('pressing Enter in the title box submits it', async ({ page, ext }) => {
        await yt.openVideo(page, yt.VIDEOS.zoo);

        const popup = await ext.openPopup();
        await popup.fill('#newTitle', 'Submitted with Enter');
        await popup.press('#newTitle', 'Enter');

        await expect.poll(() => yt.heading(page).then((h) => h.text)).toBe('Submitted with Enter');
    });

    test('a custom title with repeated spaces is cleaned up and does not freeze the page', async ({ page, ext }) => {
        await yt.openVideo(page, yt.VIDEOS.zoo);

        const popup = await ext.openPopup();
        await popup.fill('#newTitle', 'Spaced   out\ttitle');
        await popup.press('#newTitle', 'Enter');

        await expect.poll(() => yt.heading(page), { timeout: 5_000 }).toMatchObject({
            text: 'Spaced out title', tabTitle: 'Spaced out title - YouTube',
        });
    });

    test('#11 clicking Modify with an empty box leaves the heading unchanged', async ({ page, ext }) => {
        await yt.openVideo(page, yt.VIDEOS.zoo);
        const before = await yt.heading(page);

        const popup = await ext.openPopup();
        await popup.click('#modifyButton');
        await yt.settle(page);

        expect((await yt.heading(page)).text).toBe(before.text);
    });

    test('a custom title stays visible in hide mode and Reset brings back the hidden original', async ({ page, ext }) => {
        await yt.openVideo(page, yt.VIDEOS.zoo);
        const real = await yt.realTitle(page);
        await ext.command('hide');
        await expect.poll(() => yt.heading(page).then((h) => h.visible)).toBe(false);

        let popup = await ext.openPopup();
        await popup.fill('#newTitle', 'Safe title');
        await popup.click('#modifyButton');
        await expect.poll(() => yt.heading(page)).toMatchObject({
            visible: true, text: 'Safe title', tabTitle: 'Safe title - YouTube',
        });

        popup = await ext.openPopup();
        await popup.click('#resetButton');
        await expect.poll(() => yt.heading(page)).toMatchObject({
            visible: false, text: real, tabTitle: 'YouTube',
        });
    });

    test('the Hide titles switch changes hide mode and shows the current state', async ({ page, ext }) => {
        await yt.openVideo(page, yt.VIDEOS.zoo);
        const popup = await ext.openPopup();
        const toggle = popup.getByRole('switch', { name: 'Hide titles' });
        await expect(toggle).toHaveAttribute('aria-checked', 'false');
        await expect(popup.locator('#modeLine')).toHaveText(/visible/i);

        await toggle.click();
        await expect.poll(() => yt.heading(page).then((h) => h.visible)).toBe(false);
        await expect(toggle).toHaveAttribute('aria-checked', 'true');
        await expect(popup.locator('#modeLine')).toHaveText(/hidden/i);
        await expect.poll(() => ext.badge(page)).toBe('On');

        await toggle.click();
        await expect.poll(() => yt.heading(page).then((h) => h.visible)).toBe(true);
        await expect(toggle).toHaveAttribute('aria-checked', 'false');
    });

    test('renaming is disabled when the active tab is not a video', async ({ page, ext }) => {
        await yt.openSearch(page, 'me at the zoo');

        const popup = await ext.openPopup();

        await expect(popup.locator('#modifyButton')).toBeDisabled();
        await expect(popup.locator('#resetButton')).toBeDisabled();
        await expect(popup.locator('#status')).toHaveText(/open a youtube video/i);
        await expect(popup.locator('#toggleButton')).toBeEnabled();
    });
});
