// src/pages/Login.jsx
import { supabase } from '../Death/supabaseClient'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const GoogleLogin = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  const handleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`
        }
      })
      if (error) {
        console.error('Error logging in:', error)
        alert('Login failed: ' + error.message)
      }
    } catch (error) {
      console.error('Unexpected error during login:', error)
      alert('Login failed: ' + error.message)
    }
  }

  // Handle redirect after OAuth and check/create user
  useEffect(() => {
    const handleAuthRedirect = async () => {
      try {
        setLoading(true)
        
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          setLoading(false)
          return
        }

        if (session?.user) {
          const user = session.user
          console.log('User authenticated:', user.id, user.email)

          // Check if user exists in death_user table
          const { data: existingUser, error: fetchError } = await supabase
            .from('death_user')
            .select('*')
            .eq('user_idx', user.id)
            .single()

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error checking user:', fetchError)
            alert('Database error: ' + fetchError.message)
            setLoading(false)
            return
          }

          if(existingUser) {
            // User exists, redirect to dashboard
            console.log('Existing user found, redirecting to dashboard')
            navigate('/death-dashboard')
          } else {
            // New user, create record and redirect to primary info
            console.log('New user, creating record')
            const { error: insertError } = await supabase
              .from('death_user')
              .insert([
                {
                  user_idx: user.id,
                  email: user.email,
                  user_role: 'user',
                  
                }
              ])

            if (insertError) {
              console.error('Error creating user record:', insertError)
              alert('Error creating user: ' + insertError.message)
              setLoading(false)
              return
            }

            console.log('User record created, redirecting to primary info')
            navigate('/primaryinfo')
          }
        } else {
          console.log('No session found')
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Unexpected error in auth redirect:', error)
        alert('Authentication error: ' + error.message)
        setLoading(false)
      }
    }

    handleAuthRedirect()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event)
      if (event === 'SIGNED_IN' && session) {
        handleAuthRedirect()
      } else if (event === 'SIGNED_OUT') {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  if (loading) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh'
    }}>
      <h2>Welcome to Death App</h2>
      <p>Please sign in to continue</p>
      <button
        onClick={handleLogin}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        Continue with Google
      </button>
    </div>
  )
}

export default GoogleLogin