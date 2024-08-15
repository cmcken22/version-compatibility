import { Button } from "@mui/material";
import "./App.css";
import { Autocomplete } from "./features/Autocomplete";
import FileUpload from "./features/FileUpload";
import { VersionFinder } from "./features/VersionFinder";
import { useSelector } from "react-redux";
import {
  clearPreviousData,
  getAllPackageInfo,
  selectData,
  selectDependencies,
  selectDevDependencies,
  selectLoadingState,
  selectResult,
  selectSubmitAttempted,
  selectSubmitDisabled,
} from "slices/appSlice";
import { useCallback, useMemo } from "react";
import { useAppDispatch } from "store/hooks";
import { DataTable } from "./features/DataTable";
import cx from "classnames";

const App = () => {
  const dispatch = useAppDispatch();
  const submitDisabled = useSelector<any, boolean>(selectSubmitDisabled);
  const dependencies = useSelector(selectDependencies);
  const devDependencies = useSelector(selectDevDependencies);
  const loadingState = useSelector(selectLoadingState);
  const submitAttempted = useSelector(selectSubmitAttempted);

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

  return (
    <div className="App p-10">
      <div className="flex flex-col gap-9 mb-9">
        <FileUpload />
      </div>
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
