import React, { useEffect, useMemo, useState } from "react";
import throttle from "lodash.throttle";
import { Autocomplete as MuiAutocomplete, TextField } from "@mui/material";

const Autocomplete = ({
  name,
  onSearch,
  value,
  onChange,
  label,
  placeholder,
  disabled,
  ...rest
}: any) => {
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState([]);

  const _fetch = useMemo(
    () =>
      throttle(async (request: any, callback: any) => {
        try {
          if (onSearch) {
            const res = await onSearch(request.input);
            callback(res);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
          callback([]);
        }
      }, 500),
    []
  );

  useEffect(() => {
    let active = true;

    if (inputValue === "") {
      // @ts-ignore
      setOptions(value ? [value] : []);
      return undefined;
    }

    _fetch({ input: inputValue }, (results: any) => {
      if (active) {
        let newOptions: any = [];

        if (value) {
          newOptions = [value];
        }

        if (results) {
          newOptions = [...newOptions, ...results];
        }

        setOptions(newOptions);
      }
    });

    return () => {
      active = false;
    };
  }, [value, inputValue, fetch]);

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
        filterOptions={(x: any) => x}
        options={options}
        autoComplete
        includeInputInList
        filterSelectedOptions
        value={value}
        disabled={disabled}
        onChange={(event: any, newValue: any) => {
          // @ts-ignore
          setOptions(newValue ? [newValue, ...options] : options);
          if (onChange) onChange(newValue?.value);
        }}
        onInputChange={(event: any, newInputValue: any) => {
          setInputValue(newInputValue);
        }}
        renderInput={(params: any) => (
          <TextField
            {...rest}
            {...params}
            value={value}
            label={label}
            disabled={disabled}
            placeholder={placeholder}
            variant="outlined"
            fullWidth
          />
        )}
      />
    </div>
  );
};

export default Autocomplete;
