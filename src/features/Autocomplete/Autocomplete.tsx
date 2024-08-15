import React, { useCallback, useEffect, useState } from "react";
import { Autocomplete as MuiAutocomplete, TextField } from "@mui/material";
import { useDebounce } from "use-debounce";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetReposByNameQuery } from "services/npmApi";
import { useAppDispatch } from "store/hooks";
import { selectBasePackage, setBasePackage } from "slices/appSlice";
import { useSelector } from "react-redux";

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
  // const _fetch = useMemo(
  //   () =>
  //     throttle(async (request: any, callback: any) => {
  //       // try {
  //       //   if (onSearch) {
  //       //     const res = await onSearch(request.input);
  //       //     callback(res);
  //       //   }
  //       // } catch (error) {
  //       //   console.error("Error fetching data:", error);
  //       //   callback([]);
  //       // }
  //     }, 500),
  //   []
  // );

  // useEffect(() => {
  //   let active = true;

  //   if (inputValue === "") {
  //     // @ts-ignore
  //     setOptions(value ? [value] : []);
  //     return undefined;
  //   }

  //   _fetch({ input: inputValue }, (results: any) => {
  //     if (active) {
  //       let newOptions: any = [];

  //       if (value) {
  //         newOptions = [value];
  //       }

  //       if (results) {
  //         newOptions = [...newOptions, ...results];
  //       }

  //       setOptions(newOptions);
  //     }
  //   });

  //   return () => {
  //     active = false;
  //   };
  // }, [value, inputValue, fetch]);

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
