import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // refreshing the auth token
  await supabase.auth.getUser()

  const code = request.nextUrl.searchParams.get('code')
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const redirectedUrl = request.nextUrl.clone()
      redirectedUrl.searchParams.delete('code')
      // Make sure the new response preserves the cookies we just set during exchange
      const cleanResponse = NextResponse.redirect(redirectedUrl)
      // Copy over cookies from the supabaseResponse to the new redirect response
      const supabaseCookies = supabaseResponse.cookies.getAll()
      supabaseCookies.forEach((cookie) => {
        cleanResponse.cookies.set(cookie.name, cookie.value)
      })
      return cleanResponse
    }
  }

  return supabaseResponse
}
