import { useState, type FormEvent } from "react"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import {
  PopoverForm,
  PopoverFormButton,
  PopoverFormSuccess,
} from "@/components/cult-ui/popover-form"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LoginPopover() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthMessage(null)
    setActionBusy(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setAuthMessage(error.message)
    } else {
      setLoginSuccess(true)
      setTimeout(() => {
        setLoginOpen(false)
        setLoginSuccess(false)
      }, 1500)
    }

    setActionBusy(false)
  }

  return (
    <PopoverForm
      open={loginOpen}
      setOpen={(v) => {
        setLoginOpen(v)
        if (v) setAuthMessage(null)
      }}
      title="登录"
      width="240px"
      height="160px"
      showSuccess={loginSuccess}
      successChild={<PopoverFormSuccess title="登录成功" description="欢迎回来" />}
      openChild={
        <form onSubmit={handleSignIn} className="flex h-full flex-col gap-3 p-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <PopoverFormButton loading={actionBusy} text="登录" />
          </div>
          {authMessage ? (
            <div className="text-xs text-destructive">{authMessage}</div>
          ) : null}
        </form>
      }
    />
  )
}

export function UserBadge({
  email,
  onSignOut,
  busy,
}: {
  email?: string | null
  onSignOut: () => void
  busy: boolean
}) {
  const displayEmail = email ?? "未设置邮箱"
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-sm">
      <div>
        <div className="text-xs text-muted-foreground">已登录</div>
        <div className="truncate font-medium">{displayEmail}</div>
      </div>
      <Button variant="outline" size="sm" onClick={onSignOut} disabled={busy}>
        <LogOut />
        退出
      </Button>
    </div>
  )
}
