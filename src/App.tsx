import { Button } from "@mui/material";
import "./App.css";
import { Autocomplete } from "./features/Autocomplete";
import FileUpload from "./features/FileUpload";
import { VersionFinder } from "./features/VersionFinder";
import {
  clearPreviousData,
  getAllPackageInfo,
  selectDependencies,
  selectDevDependencies,
  selectLoadingState,
  selectSubmitAttempted,
  selectSubmitDisabled,
} from "slices/appSlice";
import { useCallback, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { DataTable } from "./features/DataTable";
import cx from "classnames";

const App = () => {
  const dispatch = useAppDispatch();
  const submitDisabled = useAppSelector<any, boolean>(selectSubmitDisabled);
  const dependencies = useAppSelector(selectDependencies);
  const devDependencies = useAppSelector(selectDevDependencies);
  const loadingState = useAppSelector(selectLoadingState);
  const submitAttempted = useAppSelector(selectSubmitAttempted);

  const handleSubmit = useCallback(async () => {
    await dispatch(clearPreviousData());
    setTimeout(() => {
      dispatch(getAllPackageInfo());
    });
  }, [dispatch]);

  const empty = useMemo(() => {
    if (loadingState === "loading" || !submitAttempted) return null;
    if (!dependencies?.length && !devDependencies?.length) return true;
    return false;
  }, [loadingState, dependencies, devDependencies, submitAttempted]);

  const handleKeyPress = useCallback(
    (e: any) => {
      if (submitDisabled) return;
      if (e?.code === "Enter") handleSubmit();
    },
    [submitDisabled, handleSubmit],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  return (
    <div className="App p-10">
      <pre className="mb-5">Step 1. Upload a package.json file</pre>
      <div className="flex flex-col gap-9 mb-9">
        <FileUpload />
      </div>
      <pre className="mb-8">Step 2. Select a dependency and version to compare against</pre>
      <div className="flex items-center gap-4 mb-9">
        <Autocomplete label="Package" placeholder="Select a package..." />
        <VersionFinder label="Version" placeholder="Select a version..." />
        <Button
          disabled={submitDisabled}
          onClick={handleSubmit}
          variant="outlined"
          className={cx({
            "!border-none": submitDisabled,
            "!border-gray-500": !submitDisabled,
          })}
        >
          <pre className={cx({ "!text-black": !submitDisabled })}>Submit</pre>
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
    </div>
  );
};

export default App;
