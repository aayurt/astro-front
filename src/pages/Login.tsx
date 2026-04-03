import React from 'react';
import { Page, Navbar, List, ListInput, Button, Block } from 'konsta/react';
import { authClient } from '../lib/auth-client';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await authClient.signIn.email({
      email,
      password,
    });
    setLoading(false);
    if (!error) {
      navigate('/dashboard');
    } else {
      alert(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: import.meta.env.VITE_FRONTEND_URL + '/dashboard',
    });
  };

  return (
    <Page>
      <Navbar title='Login' />
      <Block strong>
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
        <Block>
          <Button large outline onClick={handleGoogleLogin}>
            Login with Google
          </Button>
        </Block>
        <Block className='text-center'>
          <Link to='/signup'>Don't have an account? Sign up</Link>
        </Block>
      </Block>
    </Page>
  );
}
