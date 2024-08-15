import React, { useCallback, useEffect, useState } from "react";
import { Autocomplete as MuiAutocomplete, TextField } from "@mui/material";
import { useDebounce } from "use-debounce";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetReposByNameQuery } from "services/npmApi";
import { useAppDispatch } from "store/hooks";
import { selectBasePackage, setBasePackage } from "slices/appSlice";
import { useSelector } from "react-redux";
import "./Autocomplete.css";

const Autocomplete = ({ name, label, placeholder, disabled, ...rest }: any) => {
  const dispatch = useAppDispatch();
  const value = useSelector(selectBasePackage);
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [searchTerm] = useDebounce(inputValue, 500);

  const { data, error, isLoading } = useGetReposByNameQuery(
    searchTerm || skipToken,
  );

  useEffect(() => {
    setOptions(data || []);
  }, [data]);

  const handleSelect = useCallback(
    (val: any) => {
      console.clear();
      console.log("val:", val);
      dispatch(setBasePackage(val));
    },
    [dispatch],
  );

  return (
    <div className="w-96">
      <MuiAutocomplete
        id="address"
        getOptionLabel={(option: any) =>
          typeof option === "string" ? option : option.label
        }
        isOptionEqualToValue={(option: any, value: any) =>
          option?.value === value
        }
        renderOption={(props, option: any) => (
          <li {...props} className="autocomplete__option">
            {option.label}
          </li>
        )}
        filterOptions={(x: any) => x}
        options={options}
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
