import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import semver from "semver";

export const AppContext = createContext<any>({});

export const useAppContext = () => {
  const context = useContext(AppContext);
  return context;
};

const getVersionCompatibility = async (
  basePackage: string,
  baseVersion: string,
  target: string,
  currentVersion: string,
  type: string
) => {
  const bv = semver.minVersion(baseVersion);
  const cbv = semver.minVersion(currentVersion);
  const url = `https://registry.npmjs.org/${target}`;

  const npmData = await fetch(url)
    .then((response) => response.json())
    .catch((error) => console.error("Error fetching JSON:", error));

  const res = [];
  const peers: any = {};

  let startingAt: string = "";
  if (npmData && npmData.versions) {
    const versions = npmData.versions;
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

  if (npmData && npmData.versions) {
    const versions = npmData.versions;
    for (const version in versions) {
      const preRelease = semver.prerelease(version);
      if (preRelease) continue;

      const data = versions[version];
      // if (data.peerDependencies) {
      peers[version] = data.peerDependencies;
      console.log(`${target}@${version}:`, data.peerDependencies);
      // }
      if (data.peerDependencies && data.peerDependencies?.[basePackage]) {
        // @ts-ignore
        const test = semver.satisfies(bv, data.peerDependencies?.[basePackage]);
        if (test) res.push(version);
      } else if (startingAt && semver.gt(version, startingAt)) {
        res.push(version);
      }
    }
  }

  let requiresUpdate = true;
  for (const v of res) {
    // @ts-ignore
    const satisfied = semver.satisfies(cbv, v);
    if (satisfied) {
      requiresUpdate = false;
      break;
    }
  }

  return {
    type,
    npmData,
    lib: target,
    currentVersion,
    compatibleVersions: res,
    requiresUpdate: res?.length === 0 ? false : requiresUpdate,
    peers,
  };
};

const getVersionCompatibilityWrapper = async (
  jsonData: any,
  basePackage: string,
  baseVersion: string
) => {
  const types = ["dependencies", "devDependencies"];
  const promises: any = [];

  for (const type of types) {
    if (jsonData && jsonData?.[type]) {
      for (const lib in jsonData?.[type]) {
        const currentVersion = jsonData?.[type][lib];
        promises.push(
          getVersionCompatibility(
            basePackage,
            baseVersion,
            lib,
            currentVersion,
            type
          )
        );
      }
    }
  }

  const npmData: any = {};
  const dependencies: any = [];
  const devDependencies: any = [];
  await Promise.all(promises).then((res) => {
    for (const entry of res) {
      console.log("entry:", entry);
      npmData[entry?.lib] = entry?.npmData;
      if (!entry?.compatibleVersions?.length) continue;
      if (entry.type === "dependencies") dependencies.push(entry);
      if (entry.type === "devDependencies") devDependencies.push(entry);
    }
  });

  return {
    npmData,
    dependencies,
    devDependencies,
  };
};

const getPackageInfo = async ({ type, name, currentVersion }: any) => {
  const url = `https://registry.npmjs.org/${name}`;

  const npmData = await fetch(url)
    .then((response) => response.json())
    .catch((error) => console.error("Error fetching JSON:", error));

  console.log("npmData:", npmData);

  let data: any = {};
  const versions = npmData?.versions || {};
  for (const version in versions) {
    const preRelease = semver.prerelease(version);
    const { dependencies, devDependencies, peerDependencies } =
      versions[version];

    data[version] = {
      preRelease: Boolean(preRelease),
      dependencies: dependencies || {},
      devDependencies: devDependencies || {},
      peerDependencies: peerDependencies || {},
    };
  }

  return {
    type,
    name,
    currentVersion,
    data,
  };
};

class DataController {
  public jsonData: any;
  public libs: any;
  public basePackage: string;
  public baseVersion: string;
  public basePackageInfo: any;

  constructor() {
    this.jsonData = {};
    this.libs = {};
    this.basePackage = "";
    this.baseVersion = "";
    this.basePackageInfo = {};
  }

  public async setJsonData(jsonData: any) {
    this.jsonData = jsonData;
    const types = ["dependencies", "devDependencies"];
    const promises: any = [];

    for (const type of types) {
      if (jsonData && jsonData?.[type]) {
        for (const lib in jsonData?.[type]) {
          const currentVersion = jsonData?.[type][lib];
          promises.push(
            getPackageInfo({
              type,
              name: lib,
              currentVersion,
            })
          );
        }
      }
    }

    await Promise.all(promises).then((res) => {
      for (const entry of res) {
        const { name } = entry;
        this.libs[name] = entry;
      }
    });

    return this.libs;
  }

  public async setTargetLib(basePackage: string, baseVersion: string) {
    this.basePackage = basePackage;
    this.baseVersion = baseVersion;

    console.clear();
    const packageInfo: any = await getPackageInfo({
      type: "",
      name: basePackage,
      currentVersion: baseVersion,
    });
    console.log("packageInfo:", packageInfo);
    const version = semver.minVersion(baseVersion)?.version as string;
    console.log("version:", version);
    const data = packageInfo?.data?.[version];
    console.log("data:", data);
    this.basePackageInfo = data;
    return data;
  }

  public getDependencies(): any {
    const data = Object.values(this.libs).filter(
      (lib: any) => lib.type === "dependencies"
    );
    return data;
  }

  public detectRelevance(
    name: string,
    basePackage: string,
    baseVersion: string
  ): any {
    const lib = this.libs[name];
    const versions = lib?.data;
    let compatibleVersions: any = [];

    let hasDep = false;
    let startingAt: string = "";
    for (const version in versions) {
      const { preRelease, peerDependencies } = versions[version];
      if (preRelease) continue;

      const targetDep = peerDependencies?.[basePackage];
      if (!targetDep && !hasDep) continue;
      hasDep = true;
      const bv = semver.minVersion(baseVersion);
      // @ts-ignore
      const satisfied = semver.satisfies(bv, targetDep);
      if (satisfied) {
        if (!startingAt) startingAt = version;
        compatibleVersions.push(version);
        // console.log(`in order to install $`);
      } else if (startingAt && semver.gt(version, startingAt)) {
        compatibleVersions.push(version);
      }
    }

    console.log("compatibleVersions:", compatibleVersions);

    return {
      compatibleVersions,
    };
  }

  public checkDeps(name: string, v: string): any {
    const lib = this.libs[name];

    console.clear();
    console.log("checkDeps:", lib, v);
    const { peerDependencies } = lib?.data?.[v] || {};
    console.log("peerDependencies:", peerDependencies);

    // let startingAt: string = "";
    let deps: any = {};
    for (const peer in peerDependencies) {
      if (peer === this.basePackage) continue;
      let requiresUpdate = true;
      let compatibleVersions: string[] = [];
      const peerRequirement = peerDependencies[peer];
      console.log(`${peer}:`, peerRequirement);
      const currentData = this.libs[peer] || {};
      const { currentVersion, data: versions } = currentData;
      console.log(`${peer} currentVersion:`, currentVersion);
      if (currentVersion) {
        const cv = semver.minVersion(currentVersion);
        // @ts-ignore
        const currentlyStatisfied = semver.satisfies(cv, peerRequirement);
        if (currentlyStatisfied) requiresUpdate = false;
      }
      if (!deps[peer]) {
        deps[peer] = {
          name: peer,
          compatibleVersions: [],
          requiresUpdate,
        };
      }
      // // console.log("currentVersion:", currentVersion);
      // // console.log("versions:", versions);
      // // let hasDep = false;
      for (const version in versions) {
        const { preRelease } = versions[version];
        if (preRelease) continue;
        const satisfied = semver.satisfies(version, peerRequirement);
        if (satisfied) {
          // if (!startingAt) startingAt = version;
          compatibleVersions.push(version);
        }
        // else if (startingAt && semver.gt(version, startingAt)) {
        //   compatibleVersions.push(version);
        // }
      }
      deps[peer].compatibleVersions = compatibleVersions;
    }

    console.log("deps:", deps);

    return deps;
  }
}

const AppContextProvider = ({ children }: any) => {
  const [basePackage, setBasePackage] = useState("react");
  const [baseVersion, setBaseVersion] = useState("^18.3.1");
  const [result, setResult] = useState<any>(null);
  const [jsonData, setJsonData] = useState<any>(null);
  const [showInvalidReposOnly, setShowInvalidReposOnly] = useState(false);
  const [updateObject, setUpdateObject] = useState<any>({});
  const updateObjectRef = useRef<any>({});
  const [deps, setDeps] = useState<any[]>([]);

  const dataController = useRef<any>(new DataController());

  const detectVersions = useCallback(
    async (jsonData: any) => {
      setResult({});
      const { dependencies, devDependencies, npmData } =
        await getVersionCompatibilityWrapper(
          jsonData,
          basePackage,
          baseVersion
        );

      console.log({
        dependencies,
        devDependencies,
      });

      setResult({
        npmData,
        dependencies,
        devDependencies,
      });
    },
    [basePackage, baseVersion, setResult]
  );

  const handleSetJsonData = useCallback(
    async (jsonData: any) => {
      await dataController.current.setJsonData(jsonData);
      // console.clear();
      // const deps = dataController.current.getDependencies();
      // console.log("deps:", deps);
      // setDeps(deps);
      setJsonData(jsonData);
    },
    [setJsonData, setDeps]
  );

  const handleDetectVersions = useCallback(
    (jsonData: any) => {
      detectVersions(jsonData);
    },
    [detectVersions]
  );

  const handleSetUpdateObject = useCallback(
    (name: string, version: string, checked: boolean) => {
      if (checked) {
        updateObjectRef.current = {
          ...updateObjectRef.current,
          [name]: version,
        };
      } else {
        const { [name]: objToRemove, ...rest } = updateObjectRef.current;
        updateObjectRef.current = rest;
      }
      setUpdateObject(updateObjectRef.current);
    },
    [setUpdateObject]
  );

  const handleUpdate = useCallback(
    (data: any, e: any) => {
      const { compatibleVersions, peers } = data;
      const last = compatibleVersions[compatibleVersions.length - 1];
      const peerArr = Object.keys(peers);
      const lastPeer = peerArr[peerArr.length - 1];
      let v = `^${last}`;
      if (last === lastPeer) v = "latest";
      console.log(data.lib, v);
      if (handleSetUpdateObject) {
        handleSetUpdateObject(data.lib, v, e?.target?.checked);
      }
    },
    [handleSetUpdateObject]
  );

  const handleUpdateVersion = useCallback(
    (data: any, version: string) => {
      const { peers } = data;
      const peerArr = Object.keys(peers);
      const lastPeer = peerArr[peerArr.length - 1];
      let val = `^${version}`;
      if (version === lastPeer) val = "latest";
      updateObjectRef.current = {
        ...updateObjectRef.current,
        [data?.lib]: val,
      };
      setUpdateObject(updateObjectRef.current);
    },
    [handleSetUpdateObject]
  );

  const handleResetContext = useCallback(() => {
    setBasePackage("react");
    setBaseVersion("^18.3.1");
    setResult(null);
    setJsonData(null);
    setShowInvalidReposOnly(false);
    setUpdateObject({});
  }, [
    setBasePackage,
    setBaseVersion,
    setResult,
    setJsonData,
    setShowInvalidReposOnly,
    setUpdateObject,
  ]);

  const handleSubmit = useCallback(async () => {
    const res = await dataController.current.setTargetLib(
      basePackage,
      baseVersion
    );
    console.log("res:", res);
    // await dataController.setJsonData(jsonData);
    // console.clear();
    const deps = dataController.current.getDependencies();
    setDeps(deps);
    // console.log("deps:", deps);
    // for (const dep of deps) {
    //   dataController.current.detectRelevance(dep?.name, basePackage, baseVersion);
    // }
    // detectVersions(jsonData);
  }, [setDeps, basePackage, baseVersion]);

  return (
    <AppContext.Provider
      value={{
        result,
        basePackage,
        baseVersion,
        jsonData,
        showInvalidReposOnly,
        updateObject,
        updateVersion: handleUpdateVersion,
        setJsonData: handleSetJsonData,
        setBasePackage,
        setBaseVersion,
        detectVersions: handleDetectVersions,
        setShowInvalidReposOnly,
        setUpdateObject: handleSetUpdateObject,
        onUpdate: handleUpdate,
        resetContext: handleResetContext,
        dataController: dataController?.current,
        onSubmit: handleSubmit,
        deps,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
