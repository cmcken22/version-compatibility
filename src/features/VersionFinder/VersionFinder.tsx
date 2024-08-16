import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Autocomplete as MuiAutocomplete, TextField } from "@mui/material";
import { skipToken } from "@reduxjs/toolkit/query";
import { useSelector } from "react-redux";
import {
  clearPreviousData,
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

  const { data, isLoading, isFetching, status } = useGetVersionsQuery(
    basePackage || skipToken,
  );

  const loading = useMemo(() => {
    return isLoading || isFetching || status === "pending";
  }, [isLoading, isFetching, status]);

  const handleSelect = useCallback(
    (val: any) => {
      dispatch(setBaseVersion(val));
      dispatch(clearPreviousData());
    },
    [dispatch],
  );

  useEffect(() => {
    setOptions(data || []);
    if (!value) {
      const last = data?.[data?.length - 1];
      console.log("last:", last);
      handleSelect(last?.value);
    }
  }, [data]);

  const valid = useMemo<boolean>(() => {
    if (!inputValue) return true;
    const exists = options?.find((opt: any) => opt.value === inputValue);
    if (!exists) return false;
    return true;
  }, [inputValue, options]);

  return (
    <div className="w-96">
      <MuiAutocomplete
        ref={ref}
        loading={loading}
        open={open}
        value={value ?? ""}
        options={loading ? [] : options}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        // noOptionsText={`Press enter to continue with ${inputValue}`}
        getOptionLabel={(option: any) => {
          return typeof option === "string" ? option : option.label;
        }}
        isOptionEqualToValue={(option: any, value: any) => {
          return option?.value === value;
        }}
        renderOption={(props, option: any) => {
          const { key, ...rest } = props;
          return (
            <li key={key} {...rest} className="versionfinder__option">
              {option.label}
            </li>
          );
        }}
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
            error={!valid}
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
