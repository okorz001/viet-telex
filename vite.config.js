export default ({ command }) => ({
  root: "demo",
  // GitHub Pages serves this repo at /viet-telex/, so asset URLs must be
  // prefixed with that path in production. The dev server uses / so that
  // npm run demo works without any path prefix.
  base: command === "build" ? "/viet-telex/" : "/",
  server: {
    fs: {
      allow: [".."],
    },
  },
  build: {
    outDir: "../site",
    emptyOutDir: false,
  },
});
