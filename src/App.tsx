import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import cx from "classnames";
import { Autocomplete } from "./Autocomplete";
import { VersionFinder } from "./VersionFinder";
import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  Snackbar,
  SnackbarCloseReason,
  Switch,
} from "@mui/material";
import { useAppContext } from "./Context";

const DataTableRow = ({ item, idx }: any) => {
  const { updateObject, onUpdate } = useAppContext();

  const compatible = useMemo(() => {
    const { compatibleVersions } = item;
    const min = compatibleVersions[0];
    const max =
      compatibleVersions.length > 1
        ? compatibleVersions[compatibleVersions.length - 1]
        : undefined;
    const compatible = [min, max].filter((v: any) => Boolean(v));
    return compatible;
  }, [item]);

  useEffect(() => {
    return () => {
      onUpdate(item, { target: { checked: false } });
    };
  }, [onUpdate, item]);

  return (
    <tr
      key={`${item.lib}--${idx}`}
      className={cx({
        "bg-red-50": item?.requiresUpdate,
        "bg-green-50": !item?.requiresUpdate,
      })}
    >
      <td className="pl-3">{item.lib}</td>
      <td>{item.currentVersion}</td>
      <td>{compatible?.join(" - ")}</td>
      <td>{item.requiresUpdate ? "Yes" : "No"}</td>
      <td>
        <Checkbox
          checked={Boolean(updateObject?.[item.lib])}
          onChange={(e) => onUpdate(item, e)}
        />
      </td>
    </tr>
  );
};

const DataTable = ({ data }: any) => {
  const {
    basePackage,
    baseVersion,
    showInvalidReposOnly,
    updateObject,
    setUpdateObject,
    onUpdate,
  } = useAppContext();

  const options = useMemo(() => {
    const options = data?.filter((item: any) => {
      const { requiresUpdate } = item;
      if (showInvalidReposOnly && !requiresUpdate) return false;
      return true;
    });
    return options;
  }, [showInvalidReposOnly]);

  const detectAllRequiredChecked = useCallback(() => {
    for (const item of data) {
      if (item.requiresUpdate) {
        if (!updateObject[item.lib]) return false;
      }
    }
    return true;
  }, [updateObject, data]);

  const detectAllChecked = useCallback(() => {
    for (const item of data) {
      if (!updateObject[item.lib]) return false;
    }
    return true;
  }, [updateObject, data]);

  const allRequiredChecked = useMemo(() => {
    return detectAllRequiredChecked();
  }, [detectAllRequiredChecked]);

  const allChecked = useMemo(() => {
    if (showInvalidReposOnly) return detectAllRequiredChecked();
    return detectAllChecked();
  }, [detectAllChecked, detectAllRequiredChecked, showInvalidReposOnly]);

  const indeterminate = useMemo(() => {
    if (allRequiredChecked && !allChecked) return true;
    return false;
  }, [allRequiredChecked, allChecked]);

  const handleUpdate = useCallback(
    (e: any) => {
      for (const item of data) {
        if (indeterminate) {
          onUpdate(item, e);
        } else if (item.requiresUpdate || !e?.target?.checked) {
          onUpdate(item, e);
        }
      }
    },
    [data, updateObject, setUpdateObject, onUpdate, indeterminate]
  );

  return (
    <table border={1} style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th className="text-left">Library</th>
          <th className="text-left">Current Version</th>
          <th className="text-left">
            Compatible with {basePackage}@{baseVersion}
          </th>
          <th className="text-left">Requires Update</th>
          <th className="text-left">
            <Checkbox
              checked={allChecked}
              onChange={(e) => handleUpdate(e)}
              indeterminate={indeterminate}
            />
          </th>
        </tr>
      </thead>
      <tbody>
        {options.map((item: any, idx: number) => (
          <DataTableRow
            key={`${item.lib}--${basePackage}--${baseVersion}`}
            item={item}
            idx={idx}
          />
        ))}
      </tbody>
    </table>
  );
};

const copyToClipboard = (val: string) => {
  navigator.clipboard.writeText(val);
};

function FileUploader() {
  const {
    basePackage,
    setBasePackage,
    baseVersion,
    setBaseVersion,
    jsonData,
    setJsonData,
    result,
    detectVersions,
    showInvalidReposOnly,
    setShowInvalidReposOnly,
    updateObject,
    resetContext,
  } = useAppContext();
  const [openSnackbar, setOpenSnakcbar] = useState(false);

  const handleTest = useCallback(() => {
    setJsonData({
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
        // "@reduxjs/toolkit": "^1.5.1",
        // "ag-grid-community": "^20.2.0",
        // "ag-grid-enterprise": "^20.2.0",
        // "ag-grid-react": "^20.2.0",
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
        "react-hot-loader": "^4.13.0",
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
    });
  }, [setJsonData]);

  const handleFileChange = useCallback(
    (event: any) => {
      const file = event.target.files[0];
      console.clear();
      console.log("file:", file);
      if (file) {
        resetContext();
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            if (e?.target?.result) {
              // @ts-ignore
              const data = JSON.parse(e.target.result);
              setJsonData(data);
            }
          } catch (error) {
            console.error("Error parsing JSON:", error);
          }
        };

        reader.readAsText(file);
      }
    },
    [setJsonData, resetContext]
  );

  const handleSubmit = useCallback(() => {
    detectVersions(jsonData);
  }, [jsonData, detectVersions]);

  const { npmUpdateString, yarnUpdateString } = useMemo<any>(() => {
    if (!updateObject || !Object.keys(updateObject).length) return "";
    let res = "";
    for (const key in updateObject) {
      const val = updateObject[key];
      res += `${key}@${val} `;
    }
    return {
      npmUpdateString: `npm i ${res}`,
      yarnUpdateString: `yarn add ${res}`,
    };
  }, [updateObject]);

  const requiredCount = useMemo<any>(() => {
    if (!jsonData || !Object.keys(jsonData).length) return null;
    const { dependencies, devDependencies } = jsonData;
    const totalDeps = Object.keys(dependencies || {}).length;
    const totalDepsRequired =
      result?.dependencies?.filter((i: any) => i?.requiresUpdate)?.length || 0;
    const totalDevDeps = Object.keys(devDependencies || {}).length;
    const totalDevDepsRequired =
      result?.devDependencies?.filter((i: any) => i?.requiresUpdate)?.length ||
      0;
    return {
      dependencies: {
        total: totalDeps,
        required: totalDepsRequired,
      },
      devDependencies: {
        total: totalDevDeps,
        required: totalDevDepsRequired,
      },
    };
  }, [jsonData, result]);

  const handleCopyText = useCallback(
    (text: string) => {
      copyToClipboard(text);
      setOpenSnakcbar(true);
    },
    [setOpenSnakcbar]
  );

  const handleCloseSnackbar = useCallback(
    (event: React.SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
      if (reason === "clickaway") {
        return;
      }
      setOpenSnakcbar(false);
    },
    [setOpenSnakcbar]
  );

  return (
    <div className="p-10 flex flex-col gap-9">
      <div>
        <input type="file" accept=".json" onChange={handleFileChange} />
        <button onClick={handleTest}>Test</button>
      </div>
      <div className="flex items-center gap-4">
        <Autocomplete
          value={basePackage}
          onChange={setBasePackage}
          label="Package"
          placeholder="Select a package..."
          disabled={!jsonData || !Object.keys(jsonData).length}
          onSearch={async (searchVal: string) => {
            const res = await fetch(
              `https://registry.npmjs.org/-/v1/search?text=${searchVal}&size=5`
            )
              .then((response) => response.json())
              .then((data) => {
                const res: any = [];
                if (data?.objects) {
                  const { objects } = data;
                  for (const object of objects) {
                    res.push({
                      label: object.package.name,
                      value: object.package.name,
                    });
                  }
                }
                return res;
              })
              .catch((error) => {
                console.error("Error fetching data from NPM API:", error);
                return [];
              });
            return res;
          }}
        />
        <VersionFinder
          label="Version"
          placeholder="Select a version..."
          value={baseVersion}
          packageName={basePackage}
          onChange={setBaseVersion}
          disabled={!jsonData || !Object.keys(jsonData).length}
        />
        <button
          onClick={handleSubmit}
          disabled={
            !jsonData ||
            !basePackage ||
            !baseVersion ||
            !Object.keys(jsonData).length
          }
          className="disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit
        </button>
      </div>
      {result && (
        <FormGroup className="w-fit">
          <FormControlLabel
            label="Show invalid repos only"
            control={
              <Switch
                checked={showInvalidReposOnly}
                onChange={(e: any) => {
                  setShowInvalidReposOnly(e.target.checked);
                }}
              />
            }
          />
        </FormGroup>
      )}
      {result && (
        <div>
          {result?.dependencies && result?.dependencies?.length ? (
            <>
              <h2>Dependencies:</h2>
              {requiredCount?.dependencies && (
                <p className="my-3">
                  {requiredCount?.dependencies?.required} /{" "}
                  {requiredCount?.dependencies?.total} dependencies need to be
                  updated
                </p>
              )}
              <DataTable data={result.dependencies} />
            </>
          ) : null}
          {result?.devDependencies && result?.devDependencies?.length ? (
            <>
              <h2>DevDependencies:</h2>
              {requiredCount?.devDependencies && (
                <p className="my-3">
                  {requiredCount?.devDependencies?.required} /{" "}
                  {requiredCount?.devDependencies?.total} devDependencies need
                  to be updated
                </p>
              )}
              <DataTable data={result.devDependencies} />
            </>
          ) : null}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p
          className="cursor-copy w-fit"
          onClick={() => handleCopyText(npmUpdateString)}
        >
          {npmUpdateString}
        </p>
        <p
          className="cursor-copy w-fit"
          onClick={() => handleCopyText(yarnUpdateString)}
        >
          {yarnUpdateString}
        </p>
      </div>
      <Snackbar
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        open={openSnackbar}
        autoHideDuration={1000}
        onClose={handleCloseSnackbar}
        message="Text Copied"
      />
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <FileUploader />
    </div>
  );
}

export default App;
