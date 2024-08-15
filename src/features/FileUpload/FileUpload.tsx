import { useCallback } from "react";
import { setJsonData } from "slices/appSlice";
import { useAppDispatch } from "store/hooks";
import testData from "./testData";

const FileUpload = () => {
  const dispatch = useAppDispatch();

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
            }
          } catch (error) {
            console.error("Error parsing JSON:", error);
          }
        };

        reader.readAsText(file);
      }
    },
    [dispatch],
  );

  const handleTest = useCallback(() => {
    dispatch(setJsonData(testData));
  }, [dispatch]);

  return (
    <div className="flex items-center">
      <input type="file" accept=".json" onChange={handleFileChange} />
      <button onClick={handleTest}>Test</button>
    </div>
  );
};

export default FileUpload;
