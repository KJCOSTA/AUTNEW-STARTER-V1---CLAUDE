import { useEffect } from 'react'

export function LoginPage() {
  useEffect(() => {
    // BYPASS TOTAL DE LOGIN — MODO DESENVOLVIMENTO
    localStorage.setItem(
      'autnew:user',
      JSON.stringify({
        id: 'admin',
        name: 'Administrador',
        email: 'admin@autnew.com',
        role: 'admin'
      })
    )

    localStorage.setItem('autnew:token', 'DEV_BYPASS_TOKEN')

    // Redireciona direto
    window.location.href = '/dashboard'
  }, [])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0b0f1a',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif'
      }}
    >
      <div>
        <h1>AUTNEW</h1>
        <p>Entrando como administrador…</p>
      </div>
    </div>
  )
}
