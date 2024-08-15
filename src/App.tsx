import { Button } from "@mui/material";
import "./App.css";
import { Autocomplete } from "./features/Autocomplete";
import FileUpload from "./features/FileUpload";
import { VersionFinder } from "./features/VersionFinder";
import { useSelector } from "react-redux";
import {
  getAllPackageInfo,
  selectDependencies,
  selectDevDependencies,
  selectResult,
  selectSubmitDisabled,
} from "slices/appSlice";
import { useCallback } from "react";
import { useAppDispatch } from "store/hooks";
import { DataTable } from "./features/DataTable";

const App = () => {
  const dispatch = useAppDispatch();
  const submitDisabled = useSelector<any, boolean>(selectSubmitDisabled);
  const dependencies = useSelector(selectDependencies);
  const devDependencies = useSelector(selectDevDependencies);
  const result = useSelector(selectResult);

  const handleSubmit = useCallback(() => {
    dispatch(getAllPackageInfo());
  }, [dispatch]);

  return (
    <div className="App p-10">
      <div className="flex flex-col gap-9 mb-9">
        <FileUpload />
      </div>
      <div className="flex items-center gap-4 mb-9">
        <Autocomplete label="Package" placeholder="Select a package..." />
        <VersionFinder label="Version" placeholder="Select a version..." />
        <Button disabled={submitDisabled} onClick={handleSubmit}>
          Submit
        </Button>
      </div>
      <pre>{JSON.stringify(result, null, 2)}</pre>
      {dependencies?.length ? (
        <DataTable type="dependencies" data={dependencies} />
      ) : null}
      {devDependencies?.length ? (
        <DataTable type="devDependencies" data={devDependencies} />
      ) : null}
    </div>
  );
};

export default App;
