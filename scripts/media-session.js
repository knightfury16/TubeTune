// Runs in the page's own JavaScript world (manifest "world": "MAIN") because the
// media controls only see what YouTube's code assigns to navigator.mediaSession.
// It has no extension APIs; content.js signals hide mode through an attribute on <html>.
(() => {
    const HIDDEN_ATTR = 'data-tubetune-hidden';
    const session = navigator.mediaSession;
    const native = session && Object.getOwnPropertyDescriptor(MediaSession.prototype, 'metadata');
    if (!native) return;

    let real = null;
    const masked = (metadata) => new MediaMetadata({
        title: 'YouTube',
        artist: metadata.artist,
        album: metadata.album,
        artwork: metadata.artwork,
    });
    const publish = () => {
        const hidden = document.documentElement.hasAttribute(HIDDEN_ATTR);
        native.set.call(session, real && hidden ? masked(real) : real);
    };

    // YouTube reads back what it assigned, so the getter keeps returning the real value.
    Object.defineProperty(session, 'metadata', {
        configurable: true,
        get: () => real,
        set: (metadata) => {
            real = metadata;
            publish();
        },
    });
    new MutationObserver(publish).observe(document.documentElement, { attributes: true, attributeFilter: [HIDDEN_ATTR] });
})();
