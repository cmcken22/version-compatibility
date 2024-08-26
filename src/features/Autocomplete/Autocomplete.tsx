import { useCallback, useEffect, useMemo, useState } from "react";
import { Autocomplete as MuiAutocomplete, TextField } from "@mui/material";
import { useDebounce } from "use-debounce";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetReposByNameQuery } from "services/npmApi";
import { useAppDispatch, useAppSelector } from "store/hooks";
import {
  clearPreviousData,
  selectBasePackage,
  setBasePackage,
} from "slices/appSlice";
import "./Autocomplete.css";

const Autocomplete = ({ name, label, placeholder, disabled, ...rest }: any) => {
  const dispatch = useAppDispatch();
  const value = useAppSelector(selectBasePackage);
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [searchTerm] = useDebounce(inputValue, 500);

  const { data, isLoading, isFetching, status } = useGetReposByNameQuery(
    searchTerm || skipToken,
  );

  const loading = useMemo(() => {
    return isLoading || isFetching || status === "pending";
  }, [isLoading, isFetching, status]);

  useEffect(() => {
    setOptions(data || []);
  }, [data]);

  const handleSelect = useCallback(
    (val: any) => {
      dispatch(setBasePackage(val));
      dispatch(clearPreviousData());
    },
    [dispatch],
  );

  return (
    <div className="w-96">
      <MuiAutocomplete
        id="autocomplete"
        loading={loading}
        getOptionLabel={(option: any) => {
          return typeof option === "string" ? option : option.label;
        }}
        isOptionEqualToValue={(option: any, value: any) => {
          return option?.value === value;
        }}
        renderOption={(props, option: any) => {
          const { key, ...rest } = props;
          return (
            <li key={key} {...rest} className="autocomplete__option">
              {option.label}
            </li>
          );
        }}
        filterOptions={(x: any) => x}
        options={!searchTerm || loading ? [] : options}
        autoComplete
        includeInputInList
        filterSelectedOptions
        value={value ?? ""}
        disabled={disabled}
        onChange={(event: any, newValue: any) => {
          // @ts-ignore
          setOptions(newValue ? [newValue, ...options] : options);
          handleSelect(newValue?.value);
        }}
        onInputChange={(event: any, newInputValue: any) => {
          setInputValue(newInputValue);
        }}
        renderInput={(params: any) => (
          <TextField
            {...rest}
            {...params}
            value={value}
            label={<pre>{label}</pre>}
            disabled={disabled}
            placeholder={placeholder}
            variant="outlined"
            fullWidth
            className="autocomplete__input"
          />
        )}
      />
    </div>
  );
};

export default Autocomplete;
