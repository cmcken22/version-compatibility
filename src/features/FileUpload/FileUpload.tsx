import { useCallback, useState } from "react";
import { setJsonData } from "slices/appSlice";
import { useAppDispatch } from "store/hooks";
import testData from "./testData";
import { Button } from "@mui/material";

const FileUpload = () => {
  const dispatch = useAppDispatch();
  const [fileName, setFileName] = useState("");

  const handleFileChange = useCallback(
    (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => {
          try {
            if (e?.target?.result) {
              // @ts-ignore
              const data = JSON.parse(e.target.result);
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
    <div className="flex items-center gap-4">
      <Button
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
      <pre>{fileName}</pre>
      {/* <label
        htmlFor="file-upload"
        className="cursor-pointer bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Choose File
      </label>
      <input
        id="file-upload"
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      /> */}
    </div>
    // <div className="flex items-center">
    //   <input
    //     className="cursor-pointer"
    //     type="file"
    //     accept=".json"
    //     onChange={handleFileChange}
    //   />
    // </div>
  );
};

export default FileUpload;
