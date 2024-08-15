import React, { SyntheticEvent, useCallback, useMemo, useState } from "react";
import cx from "classnames";
import { Checkbox, Snackbar, SnackbarCloseReason } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import { useSelector } from "react-redux";
import {
  deselectVersion,
  makeSelectDownloadString,
  selectBasePackage,
  selectBaseVersion,
  selectResult,
  selectVersion,
} from "slices/appSlice";
import { useAppDispatch } from "store/hooks";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

const copyToClipboard = (val: string) => {
  navigator.clipboard.writeText(val);
};

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

  const checked = useMemo(() => {
    return Boolean(item?.selectedVersion);
  }, [item?.selectedVersion]);

  const handleSelect = useCallback(
    (checked: boolean, version?: string) => {
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
        className={cx("border-t-2 h-12", {
          "bg-red-50": item?.requiresUpdate,
          "bg-green-50": !item?.requiresUpdate,
        })}
      >
        <td
          className="pl-3 underline cursor-pointer"
          // onClick={handleOpenModal}
        >
          <pre>{item.name}</pre>
        </td>
        <td>
          <pre>{item.currentVersion}</pre>
        </td>
        <td
          className="min-w-96 cursor-pointer flex items-center h-12"
          onClick={() => setExpandRow(p => !p)}
        >
          {expandRow ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
          <pre>{compatible?.join(" - ")} </pre>
        </td>
        <td>
          <pre>{item.requiresUpdate ? "Yes" : "No"}</pre>
        </td>
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
                const selected = item?.selectedVersion === v;
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
    </React.Fragment>
  );
};

const DataTable = ({ data, type }: any) => {
  const basePackage = useSelector(selectBasePackage);
  const baseVersion = useSelector(selectBaseVersion);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const showInvalidReposOnly = false;

  const selectDownloadString = makeSelectDownloadString(type);
  const downloadString = useSelector(selectDownloadString);

  const { npmStr, yarnStr } = useMemo<any>(() => {
    if (!downloadString) return { npmStr: "", yarnStr: "" };
    return {
      npmStr: `npm i ${downloadString} ${type === "devDependencies" ? "--save-dev" : ""}`,
      yarnStr: `yarn add ${downloadString} ${type === "devDependencies" ? "-D" : ""}`,
    };
  }, [downloadString, type]);
  console.log("downloadString:", downloadString);
  console.log("npmStr:", npmStr);
  console.log("yarnStr:", yarnStr);

  const options = useMemo(() => {
    const options = data?.filter((item: any) => {
      const { requiresUpdate } = item;
      if (showInvalidReposOnly && !requiresUpdate) return false;
      return true;
    });
    return options.sort((a: any, b: any) => {
      var textA = a.name.toUpperCase();
      var textB = b.name.toUpperCase();
      return textA < textB ? -1 : textA > textB ? 1 : 0;
    });
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
  const handleCopyText = useCallback(
    (text: string) => {
      copyToClipboard(text);
      setOpenSnackbar(true);
    },
    [setOpenSnackbar],
  );

  const handleCloseSnackbar = useCallback(
    (event: SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
      if (reason === "clickaway") {
        return;
      }
      setOpenSnackbar(false);
    },
    [setOpenSnackbar],
  );

  return (
    <div>
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
      <div className="flex flex-col gap-2 mt-4">
        {npmStr && (
          <div
            className="cursor-copy w-fit flex items-center"
            onClick={() => handleCopyText(npmStr)}
          >
            <ContentCopyIcon fontSize="small" />
            <pre className="ml-2">{npmStr}</pre>
          </div>
        )}
        {yarnStr && (
          <div
            className="cursor-copy w-fit flex items-center"
            onClick={() => handleCopyText(yarnStr)}
          >
            <ContentCopyIcon fontSize="small" />
            <pre className="ml-2">{yarnStr}</pre>
          </div>
        )}
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
};

export default DataTable;
