import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../config/supabase';
import { API_BASE_URL } from '../../config/api';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect (() => {
    const handleCallback = async () => {
      try {
        // Get the session from Supabase after redirect
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          throw new Error('No session found');
        }

        // Store session info
        localStorage.setItem('token', session.access_token);
        localStorage.setItem('refreshToken', session.refresh_token);

        // Fetch user profile
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const userProfile = await response.json();
          if (userProfile?.user) {
            localStorage.setItem('user', JSON.stringify(userProfile.user));
          }
        } else {
          // Fallback to auth payload so UI can continue while backend profile is provisioned.
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            localStorage.setItem(
              'user',
              JSON.stringify({
                id: user.id,
                name: user.user_metadata?.name || user.user_metadata?.full_name || 'User',
                email: user.email,
                role: 'user',
                ward: 'Not specified',
              })
            );
          }
        }

        // Redirect to home
        navigate('/home');
      } catch (err) {
        setError(err.message);
        toast.error('Google sign-in callback failed. Please try again.');
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Loading...</h2>
        {error && <p className="text-red-600">{error}</p>}
      </div>
    </div>
  );
};

export default AuthCallback;
