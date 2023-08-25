// entry.cjs
async function loadApp() {
    const { app } = await import("./.svelte-kit/generated/server/internal"); // this is your normal entry file - (index.js, main.js, app.mjs etc.)
}
loadApp()
