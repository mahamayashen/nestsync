import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: ["coverage/**", "playwright-report/**", "test-results/**"],
  },
];

export default eslintConfig;
