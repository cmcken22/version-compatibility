import "./App.css";
import type { SyntheticEvent } from "react";
import type { SnackbarCloseReason } from "@mui/material";
import { Alert, Button, Snackbar } from "@mui/material";
import { Autocomplete } from "./features/Autocomplete";
import FileUpload from "./features/FileUpload";
import { VersionFinder } from "./features/VersionFinder";
import {
  clearPreviousData,
  getAllPackageInfo,
  selectDependencies,
  selectDevDependencies,
  selectLoadingState,
  selectPreventSubmitReason,
  selectSubmitAttempted,
  selectSubmitDisabled,
} from "slices/appSlice";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { DataTable } from "./features/DataTable";

const App = () => {
  const dispatch = useAppDispatch();
  const submitDisabled = useAppSelector<any, boolean>(selectSubmitDisabled);
  const dependencies = useAppSelector(selectDependencies);
  const devDependencies = useAppSelector(selectDevDependencies);
  const loadingState = useAppSelector(selectLoadingState);
  const submitAttempted = useAppSelector(selectSubmitAttempted);
  const preventSubmitReason = useAppSelector(selectPreventSubmitReason);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (submitDisabled) {
      if (preventSubmitReason) {
        setOpenSnackbar(true);
      }
      return;
    }
    await dispatch(clearPreviousData());
    setTimeout(() => {
      dispatch(getAllPackageInfo());
    });
  }, [dispatch, submitDisabled, preventSubmitReason, setOpenSnackbar]);

  const empty = useMemo(() => {
    if (loadingState === "loading" || !submitAttempted) return null;
    if (!dependencies?.length && !devDependencies?.length) return true;
    return false;
  }, [loadingState, dependencies, devDependencies, submitAttempted]);

  const handleKeyPress = useCallback(
    (e: any) => {
      if (submitDisabled) {
        if (preventSubmitReason) {
          setOpenSnackbar(true);
        }
        return;
      }
      if (e?.code === "Enter") handleSubmit();
    },
    [submitDisabled, handleSubmit, setOpenSnackbar, preventSubmitReason],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  const handleCloseSnackbar = useCallback(
    (event: SyntheticEvent | Event, reason?: SnackbarCloseReason) => {
      if (reason === "clickaway") {
        return;
      }
      setOpenSnackbar(false);
    },
    [setOpenSnackbar],
  );

  useEffect(() => {
    if (!preventSubmitReason && openSnackbar) {
      handleCloseSnackbar({} as SyntheticEvent, "timeout");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preventSubmitReason, openSnackbar]);

  return (
    <div className="App p-10">
      <pre className="mb-8">Step 1. Upload a package.json file</pre>
      <div className="flex flex-col gap-9 mb-8">
        <FileUpload />
      </div>
      <pre className="mb-8">
        Step 2. Select a dependency and version to compare against
      </pre>
      <div className="flex items-center gap-4 mb-9">
        <Autocomplete label="Package" placeholder="Select a package..." />
        <VersionFinder label="Version" placeholder="Select a version..." />
        <Button
          onClick={handleSubmit}
          variant="outlined"
          className="!border-gray-500"
        >
          <pre className="!text-black">Submit</pre>
        </Button>
      </div>
      {loadingState === "loading" ? (
        <pre className="text-2xl font-bold">Loading...</pre>
      ) : null}

      {empty === true ? (
        <pre className="text-2xl font-bold">No Data.</pre>
      ) : null}

      {empty === false ? (
        <div className="flex flex-col gap-11">
          {dependencies?.length ? (
            <DataTable type="dependencies" data={dependencies} />
          ) : null}
          {devDependencies?.length ? (
            <DataTable type="devDependencies" data={devDependencies} />
          ) : null}
        </div>
      ) : null}
      <Snackbar
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        open={openSnackbar && preventSubmitReason !== ""}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          <pre>{preventSubmitReason}</pre>
        </Alert>
      </Snackbar>
    </div>
  );
};

export default App;
