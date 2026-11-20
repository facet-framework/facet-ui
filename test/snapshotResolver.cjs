const path = require("node:path");
const root = path.resolve(__dirname, "..");
module.exports = {
  resolveSnapshotPath(testPath, extension) {
    return path.join(root, "src/i18n/snapshots", path.relative(root, testPath) + extension);
  },
  resolveTestPath(snapshotPath, extension) {
    return path.join(
      root,
      path
        .relative(path.join(root, "src/i18n/snapshots"), snapshotPath)
        .slice(0, -extension.length),
    );
  },
  testPathForConsistencyCheck: path.join(root, "src/example.spec.tsx"),
};
