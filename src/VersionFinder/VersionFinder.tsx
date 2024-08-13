import { useEffect, useMemo, useRef, useState } from "react";
import throttle from "lodash.throttle";
import { Autocomplete as MuiAutocomplete, TextField } from "@mui/material";
import semver from "semver";

async function searchNpmPackages(query: any) {
  const url = `https://registry.npmjs.org/${query}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data?.versions) {
      const res: any = [];
      for (const v in data?.versions) {
        const preRelease = semver.prerelease(v);
        if (preRelease) continue;
        res.push({
          label: v,
          value: v,
        });
      }
      if (query === "react") {
        const last = res[res.length - 1];
        res.push({
          label: `^${last.value}`,
          value: `^${last.value}`,
        });
      }
      return res;
    }

    return [];
  } catch (error) {
    console.error("Error fetching data from NPM API:", error);
    return [];
  }
}

const VersionFinder = ({
  name,
  onSearch,
  value,
  onChange,
  label,
  placeholder,
  packageName,
  disabled,
  ...rest
}: any) => {
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState<any>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<any>();

  const _fetch = useMemo(
    () =>
      throttle(async (request: any, callback: any) => {
        try {
          if (!request.input) {
            callback([]);
            return;
          }
          const res = await searchNpmPackages(request.input);
          if (res.length) {
            const last = res[res.length - 1];
            if (onChange) onChange(last.value);
          }
          callback(res);
        } catch (error) {
          console.error("Error fetching data:", error);
          callback([]);
        }
      }, 500),
    []
  );

  useEffect(() => {
    setOptions([]);
    if (onChange) onChange("");
  }, [packageName]);

  useEffect(() => {
    _fetch({ input: packageName }, (results: any) => {
      setOptions(results);
    });
  }, [packageName]);

  const valid = useMemo(() => {
    if (!value || !options || !options?.length) {
      return true;
    }
    const baseValue = semver.minVersion(value);
    const exists = options.find(
      (opt: any) => opt?.value === baseValue?.version
    );
    if (exists) return true;
    return false;
  }, [value, options]);

  return (
    <div className="w-96">
      <MuiAutocomplete
        ref={ref}
        open={open}
        value={value}
        options={options}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        noOptionsText={`Press enter to continue with ${inputValue}`}
        getOptionLabel={(option: any) =>
          typeof option === "string" ? option : option.label
        }
        isOptionEqualToValue={(option: any, value: any) =>
          option?.value === value
        }
        onInputChange={(e, newValue) => {
          setInputValue(newValue);
        }}
        onChange={(event: any, newValue: any) => {
          if (newValue) {
            const exists = options?.find(
              (o: any) => o.value === newValue.value
            );
            if (!exists) {
              // @ts-ignore
              setOptions(newValue ? [newValue, ...options] : options);
            }
          }
          if (onChange) onChange(newValue?.value);
        }}
        disabled={!packageName || disabled}
        renderInput={(params) => (
          <TextField
            {...rest}
            {...params}
            variant="outlined"
            value={inputValue}
            disabled={!packageName || disabled}
            label={label}
            placeholder={placeholder}
            error={!valid}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                options.findIndex((o: any) => o.value === inputValue) === -1
              ) {
                console.clear();
                console.log("ref:", ref);
                setOptions((o: any) =>
                  o.concat({ label: inputValue, value: inputValue })
                );
                setOpen(false);
                if (onChange) onChange(inputValue);
              }
            }}
          />
        )}
      />
    </div>
  );
};

export default VersionFinder;
