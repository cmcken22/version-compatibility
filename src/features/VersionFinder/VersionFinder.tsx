import { useCallback, useEffect, useRef, useState } from "react";
import { Autocomplete as MuiAutocomplete, TextField } from "@mui/material";
import semver from "semver";
import { skipToken } from "@reduxjs/toolkit/query";
import { useSelector } from "react-redux";
import {
  selectBasePackage,
  selectBaseVersion,
  setBaseVersion,
} from "slices/appSlice";
import { useGetVersionsQuery } from "services/npmApi";
import { useAppDispatch } from "store/hooks";
import "./VersionFinder.css";

const VersionFinder = ({
  name,
  label,
  placeholder,
  disabled,
  ...rest
}: any) => {
  const dispatch = useAppDispatch();
  const ref = useRef<any>();
  const basePackage = useSelector(selectBasePackage);
  const value = useSelector(selectBaseVersion);

  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<any>([]);

  const [inputValue, setInputValue] = useState("");

  const { data, error, isLoading } = useGetVersionsQuery(
    basePackage || skipToken,
  );

  useEffect(() => {
    setOptions(data || []);
  }, [data]);

  const handleSelect = useCallback(
    (val: any) => {
      dispatch(setBaseVersion(val));
    },
    [dispatch],
  );

  return (
    <div className="w-96">
      <MuiAutocomplete
        ref={ref}
        open={open}
        value={value}
        options={options}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        // noOptionsText={`Press enter to continue with ${inputValue}`}
        getOptionLabel={(option: any) =>
          typeof option === "string" ? option : option.label
        }
        isOptionEqualToValue={(option: any, value: any) =>
          option?.value === value
        }
        renderOption={(props, option: any) => (
          <li {...props} className="versionfinder__option">
            {option.label}
          </li>
        )}
        onInputChange={(e, newValue) => {
          setInputValue(newValue);
        }}
        onChange={(event: any, newValue: any) => {
          if (newValue) {
            const exists = options?.find(
              (o: any) => o.value === newValue.value,
            );
            if (!exists) {
              // @ts-ignore
              setOptions(newValue ? [newValue, ...options] : options);
            }
          }
          setOpen(false);
          handleSelect(newValue?.value);
        }}
        disabled={!basePackage || disabled}
        renderInput={params => (
          <TextField
            {...rest}
            {...params}
            variant="outlined"
            value={inputValue}
            disabled={!basePackage || disabled}
            label={<pre>{label}</pre>}
            placeholder={placeholder}
            className="versionfinder__input"
            onKeyDown={e => {
              if (
                e.key === "Enter" &&
                options.findIndex((o: any) => o.value === inputValue) === -1
              ) {
                console.clear();
                console.log("ref:", ref);
                setOptions((o: any) =>
                  o.concat({ label: inputValue, value: inputValue }),
                );
                setOpen(false);
                handleSelect(inputValue);
              }
            }}
          />
        )}
      />
    </div>
  );
};

export default VersionFinder;
