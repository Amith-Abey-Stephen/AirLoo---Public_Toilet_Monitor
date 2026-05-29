import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: ["Firebase/**", ".next/**", "node_modules/**"],
  },
  ...nextVitals,
];

export default eslintConfig;
