// src/pages/Login.jsx or wherever you handle login
import { supabase } from '../Death/supabaseClient'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const GoogleLogin = () => {
  const navigate = useNavigate()

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })

    if (error) console.error('Error logging in:', error)
  }

  // Redirect listener
  useEffect(() => {
    const getUserAndRedirect = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      const user = session?.user

      if (user) {
        // Check if user exists in your custom "users" table
        const { data: existingUsers, error } = await supabase
          .from('death_user')
          .select('*')
          .eq('email', user.email)

        if (existingUsers && existingUsers.length > 0) {
          navigate('/deathdashboard')
        } else {
          // Insert new user
          await supabase.from('death_user').insert([
            {
              email: user.email,
             
            }
          ])
          navigate('/primaryinfo')
        }
      }
    }

    getUserAndRedirect()
  }, [])

  return (
    <div>
      <button onClick={handleLogin}>
        Continue with Google
      </button>
    </div>
  )
}
export default GoogleLogin
