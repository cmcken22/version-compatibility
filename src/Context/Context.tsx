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
  if (npmData && npmData.versions) {
    const versions = npmData.versions;
    for (const version in versions) {
      const data = versions[version];
      const preRelease = semver.prerelease(version);
      if (preRelease) continue;
      if (data.peerDependencies) {
        peers[version] = data.peerDependencies;
      }
      if (data.peerDependencies && data.peerDependencies?.[basePackage]) {
        // @ts-ignore
        const test = semver.satisfies(bv, data.peerDependencies?.[basePackage]);
        // console.log(
        //   `${target}@${version}`,
        //   baseVersion,
        //   data.peerDependencies?.[basePackage],
        //   test
        // );
        if (test) res.push(version);
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
    lib: target,
    currentVersion,
    compatibleVersions: res,
    requiresUpdate: res?.length === 0 ? false : requiresUpdate,
    peers,
  };
};

const AppContextProvider = ({ children }: any) => {
  const [basePackage, setBasePackage] = useState("react");
  const [baseVersion, setBaseVersion] = useState("^18.3.1");
  const [result, setResult] = useState<any>(null);
  const [jsonData, setJsonData] = useState<any>(null);
  const [showInvalidReposOnly, setShowInvalidReposOnly] = useState(false);
  const [updateObject, setUpdateObject] = useState<any>({});
  const updateObjectRef = useRef<any>({});

  const detectVersions = useCallback(
    async (jsonData: any) => {
      setResult({});
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

      const dependencies: any = [];
      const devDependencies: any = [];
      await Promise.all(promises).then((res) => {
        for (const entry of res) {
          if (!entry?.compatibleVersions?.length) continue;
          if (entry.type === "dependencies") dependencies.push(entry);
          if (entry.type === "devDependencies") devDependencies.push(entry);
        }
      });

      console.log({
        dependencies,
        devDependencies,
      });

      setResult({
        dependencies,
        devDependencies,
      });
    },
    [basePackage, baseVersion, setResult]
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

  return (
    <AppContext.Provider
      value={{
        result,
        basePackage,
        baseVersion,
        jsonData,
        showInvalidReposOnly,
        updateObject,
        setJsonData,
        setBasePackage,
        setBaseVersion,
        detectVersions: handleDetectVersions,
        setShowInvalidReposOnly,
        setUpdateObject: handleSetUpdateObject,
        onUpdate: handleUpdate,
        resetContext: handleResetContext,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
