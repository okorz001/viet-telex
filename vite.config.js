export default ({ command }) => ({
  root: "demo",
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
