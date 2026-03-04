"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card/40 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-white/10 group-[.toaster]:shadow-[0_8px_32px_rgba(0,0,0,0.4)] group-[.toaster]:rounded-[24px] group-[.toaster]:px-6 group-[.toaster]:py-4",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-[11px] group-[.toast]:font-medium group-[.toast]:uppercase group-[.toast]:tracking-wider",
          title: "group-[.toast]:font-black group-[.toast]:uppercase group-[.toast]:tracking-tighter group-[.toast]:text-sm group-[.toast]:italic",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-xl group-[.toast]:font-bold group-[.toast]:text-[10px] group-[.toast]:uppercase",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-xl",
          success: "group-[.toaster]:border-emerald-500/30 group-[.toaster]:bg-emerald-500/5",
          error: "group-[.toaster]:border-red-500/30 group-[.toaster]:bg-red-500/5",
          info: "group-[.toaster]:border-primary/30 group-[.toaster]:bg-primary/5",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
