import React, { useCallback, useEffect, useMemo, useState } from "react";
import cx from "classnames";
import { Checkbox } from "@mui/material";
// import { useAppContext } from "../Context";
// import { useModal } from "../Modal";
import semver from "semver";
// import {
//   getPeerDependencies,
//   getRequiredPeerDepData,
// } from "../Context/Context";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import { useSelector } from "react-redux";
import {
  deselectVersion,
  selectBasePackage,
  selectBaseVersion,
  selectResult,
  selectVersion,
} from "slices/appSlice";
import { useAppDispatch } from "store/hooks";

const DataTableRow = ({ item, idx }: any) => {
  const dispatch = useAppDispatch();
  // const [additonalItems, setAdditonalItems] = useState<any>([]);
  const [expandRow, setExpandRow] = useState(false);
  const result = useSelector(selectResult);
  // const showModal = useModal();

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

  // useEffect(() => {
  //   return () => {
  //     // onUpdate(item, { target: { checked: false } });
  //   };
  // }, [onUpdate, item]);

  // const handleOpenModal = useCallback(() => {
  //   showModal({
  //     item: item,
  //   });
  // }, [item, showModal]);

  const checked = useMemo(() => {
    return Boolean(result?.[item.name]);
  }, [result, item]);

  // const selectedVersionIndex = useMemo(() => {
  //   const val = updateObject[item?.lib];
  //   if (!val) return -1;
  //   if (val === "latest") return item?.compatibleVersions?.length - 1;

  //   const idx = item?.compatibleVersions?.findIndex(
  //     (v: string) => v === semver.minVersion(val)?.version
  //   );
  //   return idx;
  // }, [updateObject, item]);

  // const handleUpdate = useCallback(
  //   (e: any) => {
  //     if (onUpdate) onUpdate(item, e);
  //   },
  //   [item, onUpdate]
  // );

  // const handleUpdateVersion = useCallback(
  //   async (v: string) => {
  //     if (!checked) {
  //       handleUpdate({ target: { checked: true } });
  //     }

  //     if (updateVersion) updateVersion(item, v);
  //     const otherItemsToRemove = dependencies
  //       ?.filter((o: any) => o?.relatedTo === item.name)
  //       .concat(devDependencies?.filter((o: any) => o?.relatedTo === item.name));
  //     console.clear();
  //     console.log("v:", v);
  //     console.log("otherItemsToRemove:", otherItemsToRemove);
  //     removeFromResult(otherItemsToRemove);
  //     // if (v === "32.1.0") return;

  //     setTimeout(async () => {
  //       const additonalItems: any = [];
  //       const peerDeps = await getPeerDependencies(item?.lib, v);
  //       for (const peer in peerDeps) {
  //         if (peer === basePackage) continue;
  //         const exists1 = dependencies?.find((o: any) => o?.lib === peer);
  //         const exists2 = devDependencies?.find((o: any) => o?.lib === peer);
  //         if (exists1 || exists2) continue;
  //         const currentVersion =
  //           jsonData?.dependencies?.[peer] ||
  //           jsonData?.devDependencies?.[peer] ||
  //           "N/A";
  //         const test = await getRequiredPeerDepData(
  //           peer,
  //           currentVersion,
  //           peerDeps[peer]
  //         );
  //         additonalItems.push({
  //           ...test,
  //           type: item?.type,
  //           relatedTo: item?.lib,
  //         });
  //       }

  //       console.log("additonalItems:", additonalItems);
  //       if (appendToResult && additonalItems?.length) {
  //         appendToResult(additonalItems);
  //       }
  //     });
  //     // setAdditonalItems(additonalItems);
  //   },
  //   [
  //     checked,
  //     updateVersion,
  //     item,
  //     updateVersion,
  //     jsonData,
  //     setAdditonalItems,
  //     handleUpdate,
  //     appendToResult,
  //     removeFromResult,
  //     basePackage,
  //     dependencies,
  //     devDependencies,
  //     // result,
  //   ]
  // );

  // if (item.name === "ag-grid-react") {
  //   console.log(`>>>${item.name}:`, additonalItems);
  // }

  const handleSelect = useCallback(
    (checked: boolean, version?: string) => {
      console.clear();
      console.log("item:", item?.name);
      console.log("checked:", checked);
      if (checked) {
        dispatch(selectVersion({ name: item?.name, version }));
      } else {
        dispatch(deselectVersion({ name: item?.name }));
      }
    },
    [item, dispatch],
  );

  return (
    <React.Fragment key={`${item.name}--${idx}`}>
      <tr
        key={`${item.name}--${idx}`}
        className={cx("border-t-2", {
          "bg-red-50": item?.requiresUpdate,
          "bg-green-50": !item?.requiresUpdate,
        })}
      >
        <td
          className="pl-3 underline cursor-pointer"
          // onClick={handleOpenModal}
        >
          {item.name}
        </td>
        <td>{item.currentVersion}</td>
        <td
          className="min-w-96 cursor-pointer"
          onClick={() => setExpandRow(p => !p)}
        >
          {expandRow ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
          {compatible?.join(" - ")}{" "}
        </td>
        <td>{item.requiresUpdate ? "Yes" : "No"}</td>
        <td>
          <Checkbox
            checked={checked}
            onChange={e => handleSelect(e?.target?.checked)}
          />
        </td>
      </tr>
      {expandRow && (
        <tr
          className={cx({
            "bg-red-50": item?.requiresUpdate,
            "bg-green-50": !item?.requiresUpdate,
          })}
        >
          <td />
          <td />
          <td>
            <div className="flex flex-wrap items-center gap-2 max-w-96 mb-3">
              {item?.compatibleVersions?.map((v: string, idx: number) => {
                const selected = result?.[item?.name] === v;
                return (
                  <div
                    key={`${item?.lib}--${v}`}
                    onClick={() => handleSelect(true, v)}
                    className={cx(
                      "border-2 border-black w-fit p-1 rounded cursor-pointer",
                      {
                        "border-green-400": selected,
                      },
                    )}
                  >
                    {v}
                  </div>
                );
              })}
            </div>
          </td>
          <td></td>
          <td></td>
        </tr>
      )}
      {/* {additonalItems?.map((additonalItem: any, idx: number) => {
        return (
          <DataTableRow
            key={`${item.name}--${basePackage}--${additonalItem?.lib}`}
            item={additonalItem}
            idx={idx}
          />
        );
      })} */}
    </React.Fragment>
  );
};

const DataTable = ({ data }: any) => {
  const basePackage = useSelector(selectBasePackage);
  const baseVersion = useSelector(selectBaseVersion);
  // const {
  //   basePackage,
  //   baseVersion,
  //   showInvalidReposOnly,
  //   updateObject,
  //   setUpdateObject,
  //   onUpdate,
  // } = useAppContext();
  const showInvalidReposOnly = false;

  // console.log("\n\n------------");
  // console.log("data:", data);
  // console.log("------------\n\n");

  const options = useMemo(() => {
    const options = data?.filter((item: any) => {
      const { requiresUpdate } = item;
      if (showInvalidReposOnly && !requiresUpdate) return false;
      return true;
    });
    return options;
  }, [showInvalidReposOnly, data]);

  // const detectAllRequiredChecked = useCallback(() => {
  //   for (const item of data) {
  //     if (item.requiresUpdate) {
  //       if (!updateObject[item.name]) return false;
  //     }
  //   }
  //   return true;
  // }, [updateObject, data]);

  // // console.log("updateObject:", updateObject);
  // // console.log("data:", data);

  // const detectAllChecked = useCallback(() => {
  //   for (const item of data) {
  //     if (!updateObject[item.name]) return false;
  //   }
  //   return true;
  // }, [updateObject, data]);

  // const allRequiredChecked = useMemo(() => {
  //   return detectAllRequiredChecked();
  // }, [detectAllRequiredChecked]);

  // const allChecked = useMemo(() => {
  //   if (showInvalidReposOnly) return detectAllRequiredChecked();
  //   return detectAllChecked();
  // }, [detectAllChecked, detectAllRequiredChecked, showInvalidReposOnly]);

  // const indeterminate = useMemo(() => {
  //   if (allRequiredChecked && !allChecked) return true;
  //   return false;
  // }, [allRequiredChecked, allChecked]);

  // const handleUpdate = useCallback(
  //   (e: any) => {
  //     for (const item of data) {
  //       if (indeterminate) {
  //         onUpdate(item, e);
  //       } else if (item.requiresUpdate || !e?.target?.checked) {
  //         onUpdate(item, e);
  //       }
  //     }
  //   },
  //   [data, updateObject, setUpdateObject, onUpdate, indeterminate]
  // );

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
            // checked={allChecked}
            // onChange={(e) => handleUpdate(e)}
            // indeterminate={indeterminate}
            />
          </th>
        </tr>
      </thead>
      <tbody>
        {options.map((item: any, idx: number) => (
          <DataTableRow
            key={`${item.name}--${basePackage}--${baseVersion}`}
            item={item}
            idx={idx}
          />
        ))}
      </tbody>
    </table>
  );
};

export default DataTable;
