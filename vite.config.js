export default {
  root: "demo",
  server: {
    fs: {
      allow: [".."],
    },
  },
  build: {
    outDir: "../site",
    emptyOutDir: false,
  },
};
