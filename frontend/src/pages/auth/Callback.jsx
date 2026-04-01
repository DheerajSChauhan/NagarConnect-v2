import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../config/supabase';
import { API_BASE_URL } from '../../config/api';
import AshokaSpinner from '../../components/AshokaSpinner';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect (() => {
    const handleCallback = async () => {
      try {
        // Get the session from Supabase after redirect.
        let { data: { session } } = await supabase.auth.getSession();

        // If provider redirected to root with hash params, establish session explicitly.
        if (!session && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            const { data, error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (setSessionError) {
              throw new Error(setSessionError.message);
            }

            session = data.session;
          }
        }

        if (!session) {
          navigate('/login');
          return;
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
        window.history.replaceState({}, document.title, window.location.pathname);
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
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(135deg,#f8efe2_0%,#f5e4d0_100%)]">
      <div className="text-center">
        <AshokaSpinner messageIndex={2} size={56} className="mb-4" />
        <h2 className="font-heading text-2xl font-bold mb-2">Signing you in...</h2>
        {error && <p className="text-red-600">{error}</p>}
      </div>
    </div>
  );
};

export default AuthCallback;
