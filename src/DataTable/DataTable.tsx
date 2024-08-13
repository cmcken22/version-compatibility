import React, { useCallback, useEffect, useMemo, useState } from "react";
import cx from "classnames";
import { Checkbox } from "@mui/material";
import { useAppContext } from "../Context";
import { useModal } from "../Modal";
import semver from "semver";

const DataTableRow = ({ item, idx }: any) => {
  const { updateObject, onUpdate, updateVersion, result, jsonData } =
    useAppContext();
  const showModal = useModal();
  const [additionalRows, setAdditionalRows] = useState<any[]>([]);

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

  const handleOpenModal = useCallback(() => {
    showModal({
      item: item,
    });
  }, [item, showModal]);

  const checked = useMemo(() => {
    return Boolean(updateObject?.[item.lib]);
  }, [updateObject, item]);

  const selectedVersionIndex = useMemo(() => {
    const val = updateObject[item?.lib];
    if (!val) return -1;
    if (val === "latest") return item?.compatibleVersions?.length - 1;

    const idx = item?.compatibleVersions?.findIndex(
      (v: string) => v === semver.minVersion(val)?.version
    );
    return idx;
  }, [updateObject, item]);

  const handleUpdateVersion = useCallback(
    (v: string) => {
      if (updateVersion) updateVersion(item, v);
    },
    [updateVersion, item, updateVersion]
  );

  const checkDeps = useCallback(() => {
    if (!checked) return null;
    if (selectedVersionIndex === -1) return null;
    const { compatibleVersions, peers } = item;
    const selectedVersion = compatibleVersions[selectedVersionIndex];
    const selectedPeer = peers?.[selectedVersion];

    console.clear();
    console.log("selectedVersion:", selectedVersion);
    console.log("selectedPeer:", selectedPeer);
    console.log("result:", result);

    const add: any = {};

    for (const key in selectedPeer) {
      const versionRequired = selectedPeer[key];

      for (const libName in result?.npmData) {
        if (libName !== key) continue;
        const lib = result?.npmData?.[libName];
        const versions = lib?.versions || {};
        for (const version in versions) {
          let currentlySatisfied = false;
          const currentVersion =
            jsonData?.dependencies?.[libName] ||
            jsonData?.devDependencies?.[libName];
          if (currentVersion) {
            currentlySatisfied = semver.satisfies(
              currentVersion,
              versionRequired
            );
            console.log(
              `currentlySatisfied at ${currentVersion}:`,
              currentlySatisfied
            );
            if (currentlySatisfied) continue;
          }
          const satisfied = semver.satisfies(version, versionRequired);
          if (satisfied) {
            console.log(
              "satisfied:",
              libName,
              `${version} <--> ${versionRequired}`,
              satisfied
            );
            if (!add[libName]) {
              add[libName] = {
                lib: libName,
                currentVersion,
                versions: [],
              };
            }
            add[libName].versions.push(version);
            // add.push({
            //   lib: libName,
            //   currentVersion,
            //   version,
            // });
          }
        }
      }

      console.log("add:", add);
      const arr = Object.values(add);
      console.log("arr:", arr);
      setAdditionalRows(arr);
    }
  }, [
    checked,
    selectedVersionIndex,
    item,
    result,
    jsonData,
    setAdditionalRows,
  ]);

  useEffect(() => {
    checkDeps();
  }, [checked, selectedVersionIndex]);

  return (
    <React.Fragment key={`${item.lib}--${idx}`}>
      <tr
        key={`${item.lib}--${idx}`}
        className={cx({
          "bg-red-50": item?.requiresUpdate,
          "bg-green-50": !item?.requiresUpdate,
        })}
      >
        <td className="pl-3 underline cursor-pointer" onClick={handleOpenModal}>
          {item.lib}
        </td>
        <td>{item.currentVersion}</td>
        <td>{compatible?.join(" - ")}</td>
        <td>{item.requiresUpdate ? "Yes" : "No"}</td>
        <td>
          <Checkbox checked={checked} onChange={(e) => onUpdate(item, e)} />
        </td>
      </tr>
      {checked && (
        <tr
          className={cx({
            "bg-red-50": item?.requiresUpdate,
            "bg-green-50": !item?.requiresUpdate,
          })}
        >
          <td />
          <td />
          <td className="flex flex-wrap items-center gap-2 max-w-96">
            {item?.compatibleVersions?.map((v: string, idx: number) => {
              const selected = idx === selectedVersionIndex;
              return (
                <div
                  key={`${item?.lib}--${v}`}
                  onClick={() => handleUpdateVersion(v)}
                  className={cx(
                    "border-2 border-black w-fit p-1 rounded cursor-pointer",
                    {
                      "border-green-400": selected,
                    }
                  )}
                >
                  {v}
                </div>
              );
            })}
          </td>
          <td></td>
          <td></td>
        </tr>
      )}
      {additionalRows && additionalRows?.length ? (
        <>
          {additionalRows?.map((data: any, idx: number) => {
            return (
              <tr key={`${item?.lib}--${data?.lib}--${idx}`}>
                <td>{data?.lib}</td>
                <td>{data?.currentVersion}</td>
                <td>{data?.versions}</td>
              </tr>
            );
          })}
        </>
      ) : null}
    </React.Fragment>
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

export default DataTable;
