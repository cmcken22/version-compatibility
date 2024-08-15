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
  selectSubmitDisabled,
} from "slices/appSlice";
import { useCallback } from "react";
import { useAppDispatch } from "store/hooks";
import { DataTable } from "./features/DataTable";
import cx from "classnames";

const App = () => {
  const dispatch = useAppDispatch();
  const submitDisabled = useSelector<any, boolean>(selectSubmitDisabled);
  const dependencies = useSelector(selectDependencies);
  const devDependencies = useSelector(selectDevDependencies);
  const loadingState = useSelector(selectLoadingState);

  const handleSubmit = useCallback(async () => {
    await dispatch(clearPreviousData());
    setTimeout(() => {
      dispatch(getAllPackageInfo());
    });
  }, [dispatch]);

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
      ) : (
        <div className="flex flex-col gap-11">
          {dependencies?.length ? (
            <DataTable type="dependencies" data={dependencies} />
          ) : null}
          {devDependencies?.length ? (
            <DataTable type="devDependencies" data={devDependencies} />
          ) : null}
        </div>
      )}
    </div>
  );
};

export default App;
