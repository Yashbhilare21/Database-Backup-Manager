import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Database, Shield, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Welcome back!');
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Account created successfully!');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    { icon: Database, title: 'Automated Backups', desc: 'Schedule and automate your PostgreSQL backups' },
    { icon: Shield, title: 'Encrypted Storage', desc: 'Secure encryption for all your backup data' },
    { icon: Clock, title: 'Point-in-Time Recovery', desc: 'Restore to any point with WAL support' },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-dark relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow opacity-50" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-xl bg-primary/20 shadow-glow">
                <Database className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-gradient">PG Backup Pro</h1>
            </div>
            <p className="text-xl text-muted-foreground mb-12 max-w-md">
              Enterprise-grade PostgreSQL backup automation with scheduling, encryption, and cloud storage integration.
            </p>
          </motion.div>

          <div className="space-y-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="p-2 rounded-lg bg-secondary border border-border">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="text-center">
              <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-primary/20">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xl font-bold text-gradient">PG Backup Pro</span>
              </div>
              <CardTitle className="text-2xl">
                {isLogin ? 'Welcome back' : 'Create account'}
              </CardTitle>
              <CardDescription>
                {isLogin
                  ? 'Sign in to access your backup dashboard'
                  : 'Start protecting your databases today'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {isLogin ? 'Sign In' : 'Create Account'}
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <span className="font-semibold text-primary">
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </span>
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
