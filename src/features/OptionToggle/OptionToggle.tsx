import cx from "classnames";
import { useCallback } from "react";
import "./OptionToggle.css";

const OptionToggle = ({
  className,
  options,
  getOptionLabel,
  getOptionValue,
  value,
  onChange,
}: any) => {
  const handleChange = useCallback(
    (val: any) => {
      if (onChange) onChange(val);
    },
    [onChange],
  );

  return (
    <div
      className={cx("option-toggle", {
        [className]: className,
      })}
    >
      {options.map((opt: any, idx: number) => {
        const optLabel = getOptionLabel ? getOptionLabel(opt) : opt?.label;
        const optValue = getOptionValue ? getOptionValue(opt) : opt?.value;
        const selected = value === optValue;
        const last = idx === options?.length - 1;
        const nextOption = options?.[idx + 1];
        let nextOptSelected = false;
        if (nextOption) {
          const nextOptValue = getOptionValue
            ? getOptionValue(nextOption)
            : nextOption?.value;
          nextOptSelected = nextOptValue === value;
        }
        return (
          <div
            key={optValue}
            onClick={() => handleChange(optValue)}
            className={cx("option-toggle__option", {
              ["option-toggle__option--selected"]: selected,
            })}
          >
            {selected && (
              <div
                className={cx("option-toggle__option-border", {
                  ["option-toggle__option-border--first"]: idx === 0,
                  ["option-toggle__option-border--last"]:
                    idx === options?.length - 1,
                })}
              />
            )}
            {!selected && !last && !nextOptSelected && (
              <div className="option-toggle__option-inner-border" />
            )}
            <pre>{optLabel}</pre>
          </div>
        );
      })}
      <div className="option-toggle__border" />
    </div>
  );
};

export default OptionToggle;
