// entry.cjs
async function loadApp() {
    await import("./build/server/index"); // this is your normal entry file - (index.js, main.js, app.mjs etc.)
}
loadApp()
