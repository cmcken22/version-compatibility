import React, { SyntheticEvent, useCallback, useMemo, useState } from "react";
import cx from "classnames";
import { Checkbox, Snackbar, SnackbarCloseReason } from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import { useSelector } from "react-redux";
import {
  deselectVersion,
  makeDetectAllSelected,
  makeSelectDownloadString,
  makeSelectPackages,
  selectBasePackage,
  selectBaseVersion,
  selectVersion,
} from "slices/appSlice";
import { useAppDispatch } from "store/hooks";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

const copyToClipboard = (val: string) => {
  navigator.clipboard.writeText(val);
};

const DataTableRow = ({ item, level }: any) => {
  const dispatch = useAppDispatch();
  const [expandRow, setExpandRow] = useState(false);

  const selectPackageQuery = makeSelectPackages(item?.name);
  const additionalRows = useSelector(selectPackageQuery);

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
    <React.Fragment>
      <tr
        className={cx("border-t-2 h-12", {
          "bg-red-50": item?.requiresUpdate,
          "bg-green-50": !item?.requiresUpdate,
        })}
      >
        <td
          className={cx("underline cursor-pointer", {
            "pl-3": !level,
            [`pl-${level * 10}`]: level,
          })}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: level }).map((_, idx: number) => (
                <div key={idx} className="w-2 h-2 bg-black rounded-full" />
              ))}
            </div>
            <pre>{item.name}</pre>
          </div>
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
        <td className="min-w-32">
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
      {additionalRows?.map((obj: any) => {
        return (
          <DataTableRow
            key={`${item.name}--${obj?.name}`}
            item={obj}
            level={level + 1}
          />
        );
      })}
    </React.Fragment>
  );
};

const DataTable = ({ data, type }: any) => {
  const dispatch = useAppDispatch();
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

  const requiresUpdateSelectionQuery = makeDetectAllSelected(
    type,
    (obj: any) => obj?.requiresUpdate === true,
  );
  const allRequiredChecked = useSelector(requiresUpdateSelectionQuery);
  const allSelectionQuery = makeDetectAllSelected(type);
  const allOptionsChecked = useSelector(allSelectionQuery);

  const options = useMemo(() => {
    const options = data?.filter((item: any) => {
      if (item.dependentOn) return false;
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

  const indeterminate = useMemo(() => {
    if (allRequiredChecked && !allOptionsChecked) return true;
    return false;
  }, [allRequiredChecked, allOptionsChecked]);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      for (const item of data) {
        if (checked) {
          if (indeterminate) {
            dispatch(
              selectVersion({
                name: item?.name,
                version: item?.selectedVersion,
              }),
            );
          } else if (item.requiresUpdate) {
            dispatch(
              selectVersion({
                name: item?.name,
                version: item?.selectedVersion,
              }),
            );
          }
        } else {
          dispatch(deselectVersion({ name: item?.name }));
        }
      }
    },
    [dispatch, data, indeterminate],
  );

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
      <pre className="text-2xl font-bold mb-4">{type}</pre>
      <table border={1} style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th className="text-left">
              <pre>Library</pre>
            </th>
            <th className="text-left">
              <pre>Current Version</pre>
            </th>
            <th className="text-left">
              <pre>
                Compatible with {basePackage}@{baseVersion}
              </pre>
            </th>
            <th className="text-left">
              <pre>Requires Update</pre>
            </th>
            <th className="text-left">
              <Checkbox
                checked={allOptionsChecked}
                onChange={e => handleSelectAll(e?.target?.checked)}
                indeterminate={indeterminate}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {options.map((item: any) => (
            <DataTableRow
              key={`${item.name}--${basePackage}--${baseVersion}`}
              item={item}
              level={0}
            />
          ))}
        </tbody>
      </table>
      <div className="flex flex-col gap-4 mt-5">
        {npmStr && (
          <div
            className="cursor-copy w-fit flex items-center"
            onClick={() => handleCopyText(npmStr)}
          >
            <ContentCopyIcon fontSize="small" />
            <pre className="ml-2 whitespace-break-spaces">{npmStr}</pre>
          </div>
        )}
        {yarnStr && (
          <div
            className="cursor-copy w-fit flex items-center"
            onClick={() => handleCopyText(yarnStr)}
          >
            <ContentCopyIcon fontSize="small" />
            <pre className="ml-2 whitespace-break-spaces">{yarnStr}</pre>
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
