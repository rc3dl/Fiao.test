import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { IS_NATIVE } from "@/native/useIsNative";

// Campo de contraseña. En la web es un Input normal; en la app Android añade un ojo para ver lo escrito.
// Va dentro del contenedor "relative" que ya usan los formularios.
export default function PasswordInput({ className = "", ...props }) {
  const [visible, setVisible] = useState(false);
  if (!IS_NATIVE) return <Input type="password" className={className} {...props} />;
  return (
    <>
      <Input type={visible ? "text" : "password"} className={`${className} pr-12`} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full text-muted-foreground"
      >
        {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </>
  );
}
