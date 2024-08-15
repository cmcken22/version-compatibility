import { createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { createAppSlice } from "../store/createAppSlice";
import { npmApiSlice } from "services/npmApi";
import semver from "semver";

const sliceName = "appSlice";

export interface AppSliceState {
  jsonData: any;
  basePackage: string;
  baseVersion: string;
  status: "idle" | "loading" | "failed";
  data: any;
  selected: any;
}

const initialState: AppSliceState = {
  jsonData: {},
  // basePackage: "react",
  // baseVersion: "18.3.1",
  basePackage: "ag-grid-react",
  baseVersion: "27.2.0",
  status: "idle",
  data: {},
  selected: {},
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
        const { name, currentVersion, type } = entry?.meta?.arg;
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
    });

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

export const selectVersion = createAsyncThunk(
  `${sliceName}/selectVersion`,
  async (
    { name, version }: { name: string; version?: string },
    { getState, dispatch }: any,
  ) => {
    const { data, selected } = getState()[sliceName];
    const libData = data[name];
    if (!libData) return { selected };

    const res: any = { ...selected };

    if (version === undefined) {
      const { compatibleVersions } = libData;
      const last = compatibleVersions?.[compatibleVersions?.length - 1];
      res[name] = last;
    } else {
      res[name] = version;
    }
    return {
      selected: res,
    };
  },
);

export const deselectVersion = createAsyncThunk(
  `${sliceName}/deselectVersion`,
  async (
    { name }: { name: string; version?: string },
    { getState, dispatch }: any,
  ) => {
    const { data, selected } = getState()[sliceName];
    const libData = data[name];
    if (!libData) return { selected };

    const res: any = { ...selected };
    delete res[name];

    return {
      selected: res,
    };
  },
);

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
        if (action?.payload?.selected) {
          state.selected = action.payload.selected;
        }
      })
      .addCase(
        deselectVersion.fulfilled,
        (state, action: PayloadAction<any>) => {
          if (action?.payload?.selected) {
            state.selected = action.payload.selected;
          }
        },
      );
  },
  // // You can define your selectors here. These selectors receive the slice
  // // state as their first argument.
  selectors: {
    selectBasePackage: state => state.basePackage,
    selectBaseVersion: state => state.baseVersion,
    selectSubmitDisabled: state => {
      if (!state.jsonData || Object.keys(state.jsonData || {}).length === 0)
        return true;
      if (!state.basePackage || !state.baseVersion) return true;
      return false;
    },
    selectDependencies: state => {
      const { data } = state;
      const dependencies: any = [];
      for (const key in data) {
        const obj = data[key];
        if (obj?.type === "dependencies") dependencies.push(obj);
      }
      return dependencies;
    },
    selectDevDependencies: state => {
      const { data } = state;
      const devDependencies: any = [];
      for (const key in data) {
        const obj = data[key];
        if (obj?.type === "devDependencies") devDependencies.push(obj);
      }
      return devDependencies;
    },
    selectResult: state => state.selected,
  },
});

// Action creators are generated for each case reducer function.
export const { setJsonData, setBasePackage, setBaseVersion } = appSlice.actions;

// Selectors returned by `slice.selectors` take the root state as their first argument.
export const {
  selectBasePackage,
  selectBaseVersion,
  selectSubmitDisabled,
  selectDependencies,
  selectDevDependencies,
  selectResult,
} = appSlice.selectors;
