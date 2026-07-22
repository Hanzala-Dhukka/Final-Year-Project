import { forwardRef } from "react";
import Input from "../ui/Input";
import "./Animation.css";

/**
 * ShakeInput — standard UI Input that shakes horizontally when `error` is set,
 * for invalid form feedback (A5 error animation guideline).
 */
const ShakeInput = forwardRef(function ShakeInput({ error, ...props }, ref) {
  return (
    <div className={error ? "cs-shake" : ""} style={{ width: "100%" }}>
      <Input ref={ref} error={error} {...props} />
    </div>
  );
});

export default ShakeInput;
