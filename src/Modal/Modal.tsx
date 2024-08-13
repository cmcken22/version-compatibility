import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Box, Modal as MuiModal, Typography } from "@mui/material";
import useAsyncModal from "@cmckenna/use-async-modal";
import Fade from "@mui/material/Fade";
import cx from "classnames";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  bgcolor: "background.paper",
  boxShadow: 24,
  maxHeight: "calc(100vh - 30px)",
  overflow: "auto",
  p: 4,
};

const Modal = ({ item, onResolve }: any) => {
  const handleClose = useCallback(() => {
    if (onResolve) onResolve();
  }, [onResolve]);

  const [min, max] = useMemo(() => {
    const { compatibleVersions } = item;
    const min = compatibleVersions[0];
    const max =
      compatibleVersions.length > 1
        ? compatibleVersions[compatibleVersions.length - 1]
        : min;
    return [min, max];
  }, [item]);

  console.log("min:", min);
  console.log("max:", max);

  return (
    <MuiModal
      open
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Fade in>
        <Box sx={style} className="YOOOOO">
          <Typography id="transition-modal-title" variant="h6" component="h2">
            {item?.lib}
          </Typography>
          <Typography
            id="transition-modal-description"
            sx={{ mt: 2 }}
          ></Typography>
          <table
            border={1}
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr>
                <th className="text-left">Version</th>
                <th className="text-left">Peer Dependency Versions</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(item?.peers)
                .sort()
                .map((version: any, idx: number) => {
                  const peer = item?.peers?.[version] || {};
                  let vals = [];
                  for (const key of Object.keys(peer)) {
                    const value = peer[key];
                    vals.push(`${key} @ ${value}`);
                  }

                  return (
                    <tr
                      key={`${item?.lib}--${idx}`}
                      className={cx({
                        "border-t-2": version === min,
                        "border-l-2 border-r-2":
                          version >= min && version <= max,
                        "border-b-2": version === max,
                        "border-green-200": true,
                        "bg-gray-100": idx % 2 === 0,
                      })}
                    >
                      <td className="pl-3">{version}</td>
                      <td className="pl-3">
                        <ul className="list-disc">
                          {vals.map((line, index) => {
                            return <li key={index}>{line}</li>;
                          })}
                        </ul>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </Box>
      </Fade>
    </MuiModal>
  );
};

export const useModal = () => {
  const showModal = useAsyncModal<any, any>({
    Component: Modal,
  });
  return showModal;
};

export default Modal;
