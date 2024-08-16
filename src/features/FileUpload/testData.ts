const testData = {
  name: "project-init",
  version: "1.0.0",
  description: "",
  main: "index.js",
  private: true,
  scripts: {
    analyze: "source-map-explorer public/bundle.js",
    lint: "eslint ./src",
    build: "webpack --config ./webpack/config.js",
    watch: "webpack-dev-server --config ./webpack/config.js",
    "start:dev":
      "cross-env NODE_ENV=development npm run watch & node ./server/index.js",
    "start:prod":
      "cross-env NODE_ENV=prod npm run build & cross-env NODE_ENV=prod node ./server/index.js",
    "start:test": "cross-env NODE_ENV=test npm run watch",
    "start:cypress": "npm run start:test & cypress open",
    "start:test2":
      "cross-env NODE_ENV=test npm run build & cross-env NODE_ENV=test node ./server/index.js",
    "start:cypress2":
      "npm run start:test2 & cypress run --spec cypress/integration/createProject.test.json",
  },
  keywords: [],
  author: "Ellisdon",
  license: "ISC",
  "//": ["dependencies for server only; devDependencies for webpack "],
  dependencies: {
    // "@ant-design/icons": "^4.6.2",
    // "@babel/core": "^7.4.5",
    // "@babel/plugin-proposal-class-properties": "^7.10.4",
    // "@babel/plugin-proposal-object-rest-spread": "^7.10.4",
    // "@babel/plugin-transform-runtime": "^7.10.5",
    // "@babel/polyfill": "^7.12.1",
    // "@babel/preset-env": "^7.4.5",
    // "@babel/preset-react": "^7.0.0",
    // "@babel/runtime": "^7.10.5",
    // "@datadog/browser-rum": "^1.21.0",
    "@reduxjs/toolkit": "^1.5.1",
    // "ag-grid-community": "^20.2.0",
    // "ag-grid-enterprise": "^20.2.0",
    "ag-grid-react": "^20.2.0",
    // antd: "^4.15.1",
    // "antd-dayjs-webpack-plugin": "^1.0.6",
    // axios: "^0.21.1",
    // "babel-core": "^7.0.0-bridge.0",
    // "babel-eslint": "^10.0.3",
    // "babel-loader": "^8.0.6",
    // "babel-plugin-import": "^1.13.0",
    // "body-parser": "^1.19.0",
    // classnames: "^2.3.1",
    // "convert-units": "^2.3.4",
    // cors: "^2.8.5",
    // "cross-env": "^7.0.3",
    // "css-loader": "^3.2.0",
    // dayjs: "^1.10.5",
    // "dd-trace": "^0.20.1",
    // docdash: "^1.2.0",
    // dotenv: "^8.2.0",
    // "dotenv-webpack": "^1.7.0",
    // ejs: "^3.0.1",
    // enzyme: "^3.11.0",
    // "enzyme-adapter-react-16": "^1.15.2",
    // express: "^4.17.1",
    // "express-pino-logger": "^5.0.0",
    // faker: "^5.5.3",
    // "fast-json-patch": "^3.0.0-1",
    // "file-loader": "^6.2.0",
    // "file-saver": "^2.0.5",
    // fs: "0.0.1-security",
    // "fuse.js": "^6.5.3",
    // "google-maps": "^4.3.3",
    // "html-webpack-plugin": "4",
    // jest: "^26.0.1",
    // jsdoc: "^3.6.3",
    // json2csv: "^5.0.6",
    // "lodash.debounce": "^4.0.8",
    // "lodash.isempty": "^4.4.0",
    // "lodash.isequal": "^4.5.0",
    // "lottie-react-web": "2.1.4",
    // "mini-css-extract-plugin": "^1.6.0",
    // miragejs: "^0.1.41",
    // moment: "^2.29.2",
    // "node-env-run": "^3.0.2",
    // "node-fetch": "^2.6.0",
    // "npm-run-all": "^4.1.5",
    // "pino-colada": "^2.0.0",
    // qs: "^6.10.1",
    // react: "^18.3.1",
    // "react-dom": "^18.3.1",
    // "react-hot-loader": "^4.13.0",
    // "react-image-crop": "^9.0.2",
    // "react-redux": "^7.1.3",
    // "react-router-dom": "^5.0.1",
    // "react-spinners": "^0.11.0",
    // redux: "^4.0.4",
    // "redux-logger": "^3.0.6",
    // "redux-thunk": "^2.3.0",
    // sass: "^1.77.8",
    // "sass-loader": "^8.0.0",
    // "source-map-explorer": "^2.5.2",
    // "style-loader": "^1.0.0",
    // "uglifyjs-webpack-plugin": "^2.2.0",
    // "url-loader": "4.0.0",
    // uuidv4: "^6.2.11",
    // "valid-url": "^1.0.9",
    // webpack: "^4.29.6",
    // "webpack-cli": "^3.3.0",
    // "webpack-dev-server": "^3.11.2",
    // "webpack-merge": "^5.8.0",
  },
  // devDependencies: {
  //   cypress: "^7.5.0",
  //   eslint: "^6.5.1",
  //   "eslint-config-prettier": "^8.3.0",
  //   "eslint-plugin-babel": "^5.3.0",
  //   "eslint-plugin-jsx-a11y": "^6.4.1",
  //   "eslint-plugin-react": "^7.16.0",
  //   nodemon: "^2.0.7",
  //   "pre-commit": "^1.2.2",
  // },
};

export default testData;
