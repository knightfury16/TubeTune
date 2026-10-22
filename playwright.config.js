const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/e2e',
    timeout: 120_000,
    expect: { timeout: 8_000 },
    // Each test gets its own browser; one at a time keeps YouTube from throttling us.
    workers: 1,
    fullyParallel: false,
    reporter: [['list']],
    use: {
        headless: true,
    },
});
