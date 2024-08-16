import { useCallback, useRef, useState } from "react";
import { clearPreviousData, setJsonData } from "slices/appSlice";
import { useAppDispatch } from "store/hooks";
import testData from "./testData";
import { Button } from "@mui/material";

const FileUpload = () => {
  const dispatch = useAppDispatch();
  const [fileName, setFileName] = useState("");
  const buttonRef = useRef<any>(null);

  const handleFileChange = useCallback(
    (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async e => {
          try {
            if (e?.target?.result) {
              // @ts-ignore
              const data = JSON.parse(e.target.result);
              await dispatch(clearPreviousData());
              dispatch(setJsonData(data));
              setFileName(file.name);
            }
          } catch (error) {
            console.error("Error parsing JSON:", error);
            setFileName("");
          }
        };
        reader.readAsText(file);
      }
    },
    [dispatch, setFileName],
  );

  // const handleTest = useCallback(() => {
  //   dispatch(setJsonData(testData));
  // }, [dispatch]);

  return (
    <div
      className="flex items-center gap-4 w-fit cursor-pointer"
      onClick={() => buttonRef?.current?.click()}
    >
      <Button
        ref={buttonRef}
        variant="contained"
        component="label"
        className="shadow-none !bg-gray-500"
      >
        <pre>Upload File</pre>
        <input
          id="file-upload"
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </Button>
      <pre>{fileName ? fileName : "Select a file to begin"}</pre>
    </div>
  );
};

export default FileUpload;
