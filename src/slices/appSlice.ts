import {
  createAsyncThunk,
  current,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { createAppSlice } from "../store/createAppSlice";
import { npmApiSlice } from "services/npmApi";
import semver from "semver";
import testData from "../features/FileUpload/testData";
import { createSelector } from "reselect";

const sliceName = "appSlice";

export interface AppSliceState {
  jsonData: any;
  basePackage: string;
  baseVersion: string;
  status: "idle" | "loading" | "failed";
  data: any;
  // selected: any;
}

const initialState: AppSliceState = {
  jsonData: {},
  // jsonData: testData,
  basePackage: "react",
  baseVersion: "18.3.1",
  // basePackage: "ag-grid-react",
  // baseVersion: "27.2.0",
  status: "idle",
  data: {},
  // selected: {},
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
            console.log(`${peerDepName}:`, compatibleVersions);
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
        const { name, type } = entry?.meta?.arg;
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
      let requiresUpdate = true;
      const data = res[key];
      const currentVersion =
        jsonData["dependencies"]?.[key] ||
        jsonData["devDependencies"]?.[key] ||
        null;
      const cv = currentVersion
        ? semver.minVersion(currentVersion)?.version
        : null;
      const satisfied = currentVersion
        ? data?.compatibleVersions.includes(cv)
        : false;
      requiresUpdate = !satisfied;
      res[key].requiresUpdate = requiresUpdate;
      res[key].currentVersion = currentVersion;
    }

    return res;
  },
);

export const checkForAdditionalDependencies = createAsyncThunk(
  `${sliceName}/checkForAdditionalDependencies`,
  async (
    { name, version }: { name: string; version: string },
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
      let requiresUpdate = true;
      const data = res[key];
      const currentVersion = data?.currentVersion
        ? semver.minVersion(data?.currentVersion)?.version
        : null;
      const satisfied = data?.compatibleVersions.includes(currentVersion);
      requiresUpdate = !satisfied;
      res[key].requiresUpdate = requiresUpdate;
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
    { name, version }: { name: string; version?: string },
    { getState, dispatch }: any,
  ) => {
    const { data, selected } = getState()[sliceName];
    const libData = data[name];
    if (!libData) return { selected };

    let formattedVersion = version;
    if (formattedVersion === undefined) {
      const { compatibleVersions } = libData;
      const last = compatibleVersions?.[compatibleVersions?.length - 1];
      formattedVersion = last;
    }

    if (!data?.[name] || data?.[name]?.selectedVersion !== formattedVersion) {
      dispatch(
        checkForAdditionalDependencies({ name, version: formattedVersion! }),
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
  return createSelector([selectData], data => {
    const res: any = [];
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
        },
      )
      .addCase(getAllPackageInfo.rejected, state => {
        state.status = "failed";
        state.data = {};
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
    selectSubmitDisabled: state => {
      if (!state.jsonData || Object.keys(state.jsonData || {}).length === 0)
        return true;
      if (!state.basePackage || !state.baseVersion) return true;
      return false;
    },
    selectLoadingState: state => state.status,
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
  selectSubmitDisabled,
  selectLoadingState,
} = appSlice.selectors;
