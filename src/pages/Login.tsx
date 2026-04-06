import React from 'react';
import { Page, Navbar, List, ListInput, Button, Block } from 'konsta/react';
import { authClient } from '../lib/auth-client';
import { useNavigate, Link } from 'react-router-dom';
import { LoadingPlanet } from '../components/LoadingPlanet';

export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
      });
      if (!error) {
        navigate('/dashboard');
      } else {
        setErrorMessage(error.message || 'The cosmic connection failed. Please check your credentials.');
      }
    } catch (err: any) {
      setErrorMessage('I am sorry, I am currently unable to access my celestial insights. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: (import.meta.env.VITE_FRONTEND_URL || window.location.origin) + (import.meta.env.VITE_BASE_PATH || '') + '/dashboard',
    });
  };

  return (
    <Page>
      <Navbar title='Login' />
      {loading && <LoadingPlanet />}
      <Block strong>
        {errorMessage && (
          <Block className="text-red-500 text-sm text-center mb-4 italic">
            {errorMessage}
          </Block>
        )}
        <List strongIos insetIos>
          <ListInput
            label='Email'
            type='email'
            placeholder='Your email'
            value={email}
            onInput={(e) => setEmail(e.target.value)}
          />
          <ListInput
            label='Password'
            type='password'
            placeholder='Your password'
            value={password}
            onInput={(e) => setPassword(e.target.value)}
          />
        </List>
        <Block>
          <Button large onClick={handleLogin} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </Block>
        {/* <Block>
          <Button large outline onClick={handleGoogleLogin}>
            Login with Google
          </Button>
        </Block> */}
        <Block className='text-center text-blue-500'>
          <Link to='/signup'>Don't have an account? Sign up</Link>
        </Block>
      </Block>
    </Page>
  );
}
