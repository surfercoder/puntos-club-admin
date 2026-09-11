import * as React from "react"

import { cn } from "@/lib/utils"

// Los emails se guardan siempre en minuscula. En vez de repetir la regla en
// cada formulario, el input de type="email" la aplica solo: teclado de email,
// sin autocapitalizado y el valor pasa a minuscula antes de llegar al onChange
// de quien lo use (controlado o no).
// ponytail: al escribir una mayuscula en el medio del texto el cursor salta al
// final, porque un input type="email" no expone setSelectionRange. Si molesta,
// normalizar en onBlur en vez de onChange.
function Input({ className, type, onChange, ...props }: React.ComponentProps<"input">) {
  const isEmail = type === "email"

  const handleChange = isEmail
    ? (event: React.ChangeEvent<HTMLInputElement>) => {
        const lower = event.target.value.toLowerCase()
        if (event.target.value !== lower) event.target.value = lower
        onChange?.(event)
      }
    : onChange

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...(isEmail && {
        inputMode: "email" as const,
        autoCapitalize: "none",
        autoCorrect: "off",
        spellCheck: false,
      })}
      {...props}
      onChange={handleChange}
    />
  )
}

export { Input }
