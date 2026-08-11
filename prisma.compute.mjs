export default {
  app: {
    name: "bankchase",
    framework: "nextjs",
    httpPort: 3000,
    build: {
      command: "pnpm run build",
      outputDirectory: ".next/standalone",
    },
  },
};
