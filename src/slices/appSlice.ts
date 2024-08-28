import {
  createAsyncThunk,
  current,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { createAppSlice } from "../store/createAppSlice";
import { npmApiSlice } from "services/npmApi";
import semver from "semver";
import { createSelector } from "reselect";
import * as yup from "yup";

const sliceName = "appSlice";

export interface AppSliceState {
  jsonData: any;
  basePackage: string;
  baseVersion: string;
  status: "idle" | "loading" | "failed";
  data: any;
  submitAttempted: boolean;
}

const initialState: AppSliceState = {
  jsonData: {},
  basePackage: "react",
  baseVersion: "",
  status: "idle",
  data: {},
  submitAttempted: false,
};

export const getRequiredPeerDependencies = createAsyncThunk(
  `${sliceName}/getRequiredPeerDependencies`,
  async (
    { name, version }: { name: string; version: string },
    { getState, dispatch }: any,
  ) => {
    const response = await dispatch(
      npmApiSlice.endpoints.getPackageVersionInfo.initiate({ name, version }),
    );

    const res: any = {};
    if (response?.status === "fulfilled") {
      const { data } = response;
      if (data?.peerDependencies) {
        const { peerDependencies } = data;
        for (const peerDepName in peerDependencies) {
          const requiredVersion = peerDependencies[peerDepName];
          const compatibleVersionsResonse = await dispatch(
            npmApiSlice.endpoints.getCompatibleVersionsByCondition.initiate({
              name: peerDepName,
              condition: requiredVersion,
            }),
          );
          if (compatibleVersionsResonse?.status === "fulfilled") {
            const { data: compatibleVersions } = compatibleVersionsResonse;
            res[peerDepName] = compatibleVersions;
          }
        }
      }
    }

    return res;
  },
);

// Async thunk to call an endpoint from the pokemonApiSlice
export const getCompatibleVersionsByComparison = createAsyncThunk(
  `${sliceName}/getCompatibleVersionsByComparison`,
  async (
    {
      type,
      name,
      basePackage,
      baseVersion,
    }: {
      type: string;
      name: string;
      basePackage: string;
      baseVersion: string;
    },
    { getState, dispatch }: any,
  ) => {
    const bv = semver.minVersion(baseVersion);
    const getPackageInfoResponse = await dispatch(
      npmApiSlice.endpoints.getPackageInfo.initiate(name),
    );

    const res: string[] = [];
    if (getPackageInfoResponse?.status === "fulfilled") {
      const { data } = getPackageInfoResponse;
      let startingAt: string = "";
      if (data && data.versions) {
        const versions = data.versions;
        for (const version in versions) {
          const preRelease = semver.prerelease(version);
          if (preRelease) continue;
          const data = versions[version];
          if (data.peerDependencies && data.peerDependencies?.[basePackage]) {
            startingAt = version;
            break;
          }
        }
      }
      if (data && data.versions) {
        const versions = data.versions;
        for (const version in versions) {
          const preRelease = semver.prerelease(version);
          if (preRelease) continue;
          const data = versions[version];
          // peers[version] = data.peerDependencies;
          if (data.peerDependencies && data.peerDependencies?.[basePackage]) {
            const satisfied = semver.satisfies(
              // @ts-ignore
              bv,
              data.peerDependencies?.[basePackage],
            );
            if (satisfied) res.push(version);
          } else if (startingAt && semver.gt(version, startingAt)) {
            res.push(version);
          }
        }
      }
    }

    return res;
  },
);

// Async thunk to call an endpoint from the pokemonApiSlice
export const getAllPackageInfo = createAsyncThunk(
  `${sliceName}/getAllPackageInfo`,
  async (_, { getState, dispatch }: any) => {
    const { jsonData, basePackage, baseVersion } = getState()[sliceName];

    const getRequiredPeerDependenciesResponse = await dispatch(
      getRequiredPeerDependencies({ name: basePackage, version: baseVersion }),
    );

    let res: any = {};
    if (getRequiredPeerDependenciesResponse?.payload) {
      const { payload } = getRequiredPeerDependenciesResponse;
      for (const name in payload) {
        let type = "dependencies";
        if (jsonData["devDependencies"]?.[name]) type = "devDependencies";
        const currentVersion =
          jsonData["dependencies"]?.[name] ||
          jsonData["devDependencies"]?.[name] ||
          null;
        const compatibleVersions = payload[name];
        if (!compatibleVersions?.length) continue;
        if (!res[name]) {
          res[name] = {
            type,
            name,
            currentVersion,
            compatibleVersions: [],
          };
        }
        res[name].compatibleVersions = compatibleVersions;
      }
    }

    const promises: any = [];
    const types = ["dependencies", "devDependencies"];
    for (const type of types) {
      const items = jsonData?.[type] || {};
      for (const libName in items) {
        promises.push(
          dispatch(
            getCompatibleVersionsByComparison({
              type,
              name: libName,
              basePackage,
              baseVersion,
            }),
          ),
        );
      }
    }

    await Promise.all(promises).then(result => {
      for (const entry of result) {
        if (!entry?.payload || !entry?.payload?.length) continue;
        const { payload: compatibleVersions } = entry;
        const { name, type } = entry.meta.arg;
        if (!res[name]) {
          res[name] = {
            type,
            name,
            compatibleVersions: [],
          };
        }
        res[name].compatibleVersions = compatibleVersions;
      }
    });

    for (const key in res) {
      const data = res[key];
      const currentVersion =
        jsonData["dependencies"]?.[key] ||
        jsonData["devDependencies"]?.[key] ||
        null;

      if (!currentVersion) {
        res[key].requiresUpdate = true;
        res[key].currentVersion = null;
      } else {
        let satisfied = false;
        const compatibleVersions = data?.compatibleVersions || [];
        for (const v of compatibleVersions) {
          satisfied = semver.satisfies(v, currentVersion);
          if (satisfied) break;
        }
        res[key].requiresUpdate = !satisfied;
        res[key].currentVersion = currentVersion;
      }
    }

    return res;
  },
);

const determinVersionToSelect = (data: any) => {
  const { compatibleVersions, currentVersion } = data;
  if (currentVersion) {
    for (const v of compatibleVersions) {
      const satisfied = semver.satisfies(v, currentVersion);
      if (satisfied) return currentVersion;
    }
  }
  const last = compatibleVersions?.[compatibleVersions?.length - 1];
  return last;
};

export const checkForAdditionalDependencies = createAsyncThunk(
  `${sliceName}/checkForAdditionalDependencies`,
  async (
    {
      name,
      version,
      selectAll,
    }: { name: string; version: string; selectAll?: boolean },
    { getState, dispatch }: any,
  ) => {
    await dispatch(removeAdditionalDependencies({ name }));

    const { data, jsonData, basePackage } = getState()[sliceName];

    const getRequiredPeerDependenciesResponse = await dispatch(
      getRequiredPeerDependencies({ name, version }),
    );

    let res: any = {};
    if (getRequiredPeerDependenciesResponse?.payload) {
      const { payload } = getRequiredPeerDependenciesResponse;
      for (const currName in payload) {
        if (currName === basePackage) continue;
        if (data[currName]) continue;
        let type = "dependencies";
        if (jsonData["devDependencies"]?.[currName]) type = "devDependencies";
        const currentVersion =
          jsonData["dependencies"]?.[currName] ||
          jsonData["devDependencies"]?.[currName] ||
          null;
        const compatibleVersions = payload[currName];
        if (!compatibleVersions?.length) continue;
        if (!res[currName]) {
          res[currName] = {
            type,
            name: currName,
            currentVersion,
            compatibleVersions: [],
            dependentOn: name,
          };
        }
        res[currName].compatibleVersions = compatibleVersions;
      }
    }

    for (const key in res) {
      const data = res[key];
      const currentVersion = data?.currentVersion
        ? semver.minVersion(data?.currentVersion)?.version
        : null;
      if (!currentVersion) {
        res[key].requiresUpdate = true;
        res[key].currentVersion = null;
      } else {
        let satisfied = false;
        const compatibleVersions = data?.compatibleVersions || [];
        for (const v of compatibleVersions) {
          satisfied = semver.satisfies(v, currentVersion);
          if (satisfied) break;
        }
        res[key].requiresUpdate = !satisfied;
        res[key].currentVersion = currentVersion;
      }
      if (selectAll) {
        res[key].selectedVersion = determinVersionToSelect(data);
      }
    }

    return res;
  },
);

export const removeAdditionalDependencies = createAsyncThunk(
  `${sliceName}/removeAdditionalDependencies`,
  async ({ name }: { name: string }, { getState, dispatch }: any) => {
    const { data } = getState()[sliceName];

    const keysToRemove: string[] = [];
    for (const key in data) {
      const obj = data[key];
      if (obj.dependentOn === name) {
        keysToRemove.push(key);
        dispatch(removeAdditionalDependencies({ name: key }));
      }
    }

    return keysToRemove;
  },
);

export const selectVersion = createAsyncThunk(
  `${sliceName}/selectVersion`,
  async (
    {
      name,
      version,
      selectAll,
    }: { name: string; version?: string; selectAll?: boolean },
    { getState, dispatch }: any,
  ) => {
    const { data, selected } = getState()[sliceName];
    const libData = data[name];
    if (!libData) return { selected };

    let formattedVersion = version;
    if (formattedVersion === undefined) {
      formattedVersion = determinVersionToSelect(libData);
    }

    if (!data?.[name] || data?.[name]?.selectedVersion !== formattedVersion) {
      dispatch(
        checkForAdditionalDependencies({
          name,
          version: formattedVersion!,
          selectAll,
        }),
      );
    }

    return {
      name,
      selectedVersion: formattedVersion,
    };
  },
);

export const deselectVersion = createAsyncThunk(
  `${sliceName}/deselectVersion`,
  async (
    { name }: { name: string; version?: string },
    { getState, dispatch }: any,
  ) => {
    dispatch(removeAdditionalDependencies({ name }));

    return {
      name,
    };
  },
);

// Base selector to get data from state
export const selectState = (state: any) => {
  return state?.[sliceName];
};

export const selectData = (state: any) => {
  return state?.[sliceName]?.data;
};

// Memoized selector for dependencies
export const selectDependencies = createSelector([selectData], data => {
  const dependencies = [];
  for (const key in data) {
    const obj = data[key];
    if (obj?.type === "dependencies") dependencies.push(obj);
  }
  return dependencies;
});

// Memoized selector for devDependencies
export const selectDevDependencies = createSelector([selectData], data => {
  const devDependencies = [];
  for (const key in data) {
    const obj = data[key];
    if (obj?.type === "devDependencies") devDependencies.push(obj);
  }
  return devDependencies;
});

// Memoized selector for selected versions
export const selectResult = createSelector([selectData], data => {
  const res: any = {};
  for (const key in data) {
    const obj = data[key];
    if (obj.selectedVersion) {
      res[key] = obj.selectedVersion;
    }
  }
  return res;
});

export const makeSelectDownloadString = (type: string) => {
  return createSelector([selectState], state => {
    const { data, basePackage, baseVersion } = state;
    const res: any = [`${basePackage}@${baseVersion}`];
    for (const key in data) {
      const obj = data[key];
      if (obj?.type !== type) continue;
      if (obj.selectedVersion) {
        res.push(`${obj?.name}@${obj.selectedVersion}`);
      }
    }
    return res?.join(" ");
  });
};

export const makeSelectPackages = (name: string) => {
  return createSelector([selectData], data => {
    const res: any = [];
    for (const key in data) {
      const obj = data[key];
      if (obj?.dependentOn === name) {
        res.push(obj);
      }
    }
    return res.sort((a: any, b: any) => {
      var textA = a.name.toUpperCase();
      var textB = b.name.toUpperCase();
      return textA < textB ? -1 : textA > textB ? 1 : 0;
    });
  });
};

export const makeDetectAllSelected = (type: string, filter?: any) => {
  return createSelector([selectData], data => {
    let count = 0;
    let total = 0;
    for (const key in data) {
      const obj = data[key];
      if (obj?.type !== type) continue;
      if (filter && filter(obj) === false) continue;
      if (obj?.selectedVersion) count++;
      total++;
    }
    if (total === 0 && count === 0) return false;
    return total === count;
  });
};

// If you are not using async thunks you can use the standalone `createSlice`.
export const appSlice = createAppSlice({
  name: "appSlice",
  initialState,
  reducers: create => ({
    setJsonData: create.reducer((state, action: PayloadAction<object>) => {
      state.jsonData = action?.payload || {};
    }),
    setBasePackage: create.reducer((state, action: PayloadAction<string>) => {
      state.basePackage = action?.payload || "";
      state.baseVersion = "";
    }),
    setBaseVersion: create.reducer((state, action: PayloadAction<string>) => {
      state.baseVersion = action?.payload || "";
    }),
    clearPreviousData: create.reducer(state => {
      state.submitAttempted = false;
      state.data = {};
    }),
  }),
  extraReducers: builder => {
    builder
      .addCase(getAllPackageInfo.pending, state => {
        state.status = "loading";
        state.data = {};
      })
      .addCase(
        getAllPackageInfo.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.status = "idle";
          state.data = action?.payload || {};
          state.submitAttempted = true;
        },
      )
      .addCase(getAllPackageInfo.rejected, state => {
        state.status = "failed";
        state.data = {};
        state.submitAttempted = true;
      })
      .addCase(selectVersion.fulfilled, (state, action: PayloadAction<any>) => {
        const { name, selectedVersion } = action.payload;
        try {
          state.data[name].selectedVersion = selectedVersion;
        } catch (error) {
          console.error(`state.data: ${name}`, current(state.data));
          console.error(error);
        }
      })
      .addCase(
        deselectVersion.fulfilled,
        (state, action: PayloadAction<any>) => {
          const { name } = action.payload;
          if (state.data[name]) {
            delete state.data[name].selectedVersion;
          }
        },
      )
      .addCase(
        checkForAdditionalDependencies.fulfilled,
        (state, action: PayloadAction<any>) => {
          const additionlDeps = action.payload || {};
          state.data = {
            ...state.data,
            ...additionlDeps,
          };
        },
      )
      .addCase(
        removeAdditionalDependencies.fulfilled,
        (state, action: PayloadAction<any>) => {
          const keysToRemove = action.payload || {};
          for (const key of keysToRemove) {
            if (state.data[key]) {
              delete state.data[key];
            }
          }
        },
      );
  },
  // You can define your selectors here. These selectors receive the slice
  // state as their first argument.
  selectors: {
    selectBasePackage: state => state.basePackage,
    selectBaseVersion: state => state.baseVersion,
    selectSubmitAttempted: state => state.submitAttempted,
    selectSubmitDisabled: state => {
      if (!state.jsonData || Object.keys(state.jsonData || {}).length === 0)
        return true;
      if (!state.basePackage || !state.baseVersion) return true;
      return false;
    },
    selectLoadingState: state => state.status,
    selectPreventSubmitReason: state => {
      const schema = yup.object().shape({
        jsonData: yup
          .object()
          .required("Package.json file is required")
          .test(
            "is-not-empty",
            "Package.json file is required",
            value => value && Object.keys(value).length > 0,
          ),
        basePackage: yup.string().required("Package is required"),
        baseVersion: yup.string().required("Version is required"),
      });

      try {
        schema.validateSync(state, { abortEarly: false });
        return "";
      } catch (error: any) {
        let errorString = "";
        const errors = error.errors || [];
        for (const err of errors) {
          errorString += `${err} \n`;
        }
        return errorString;
      }
    },
  },
});

// Action creators are generated for each case reducer function.
export const {
  setJsonData,
  setBasePackage,
  setBaseVersion,
  clearPreviousData,
} = appSlice.actions;

// Selectors returned by `slice.selectors` take the root state as their first argument.
export const {
  selectBasePackage,
  selectBaseVersion,
  selectSubmitAttempted,
  selectSubmitDisabled,
  selectLoadingState,
  selectPreventSubmitReason,
} = appSlice.selectors;
