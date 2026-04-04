import React from 'react';
import { Page, Navbar, List, ListInput, Button, Block } from 'konsta/react';
import { authClient } from '../lib/auth-client';
import { useNavigate, Link } from 'react-router-dom';

export default function SignupPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  const handleSignup = async () => {
    setLoading(true);
    const { error } = await authClient.signUp.email({
      email,
      password,
      name,
    });
    setLoading(false);
    if (!error) {
      navigate('/onboarding');
    } else {
      alert(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: (import.meta.env.VITE_FRONTEND_URL || window.location.origin) + (import.meta.env.VITE_BASE_PATH || '') + '/onboarding',
    });
  };

  return (
    <Page>
      <Navbar title="Sign Up" />
      <Block strong>
        <List strongIos insetIos>
          <ListInput
            label="Name"
            type="text"
            placeholder="Your name"
            value={name}
            onInput={(e) => setName(e.target.value)}
          />
          <ListInput
            label="Email"
            type="email"
            placeholder="Your email"
            value={email}
            onInput={(e) => setEmail(e.target.value)}
          />
          <ListInput
            label="Password"
            type="password"
            placeholder="Your password"
            value={password}
            onInput={(e) => setPassword(e.target.value)}
          />
        </List>
        <Block>
          <Button large onClick={handleSignup} disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </Block>
        {/* <Block>
          <Button large outline onClick={handleGoogleLogin}>
            Sign up with Google
          </Button>
        </Block> */}
        <Block className="text-center">
          <Link to="/login">Already have an account? Login</Link>
        </Block>
      </Block>
    </Page>
  );
}
