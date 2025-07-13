import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Mail, ShoppingBag, User, Lock, Phone } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from "framer-motion";
import {Loader2} from "lucide-react"


export function Auth() {

  const [activeTab, setActiveTab] = useState('signin'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [signInPhone, setSignInPhone] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [verificationStep, setVerificationStep] = useState<'initial' | 'otp_sent' | 'verified'>('initial');
  const [justSignedUp, setJustSignedUp] = useState(false); 
 

  const navigate = useNavigate();
  const { 
    signInWithEmail, 
    signInWithPassword, 
    signInWithGoogle, 
    sendOtp, verifyPhoneOtp, checkPhoneVerification 
  } = useAuth();
  const { toast } = useToast();


  // Countdown effect for OTP resend
  useEffect(()=>{
    if (countdown > 0) {
      const timer = setTimeout(()=>setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);


    // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const isFullyVerified = await checkPhoneVerification(user.id);
        if (isFullyVerified) {
          navigate('/');
        }
      }
    };
    checkAuth();
  }, [navigate]);

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
  // If the input starts with '+1', don't format it (keep as international)
  if (value.startsWith('+1')) {
    return value;
  }
  
  // Regular formatting for US numbers without country code
  const phoneNumber = value.replace(/[^\d]/g, '');
  if (phoneNumber.length <= 3) return phoneNumber;
  if (phoneNumber.length <= 6) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  }
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
};

  // Handle magic link sign-in
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signInWithEmail(email);
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      } else {
        toast({
          title: "Check your email!",
          description: "We've sent you a magic link to sign in.",
        });
        setEmail('');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle email/password sign-in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Verify credentials
      const { data, error } = await signInWithPassword(email, password);
      if (error) throw error;

      // Verify phone number matches
      const normalizedPhone = `+1${signInPhone.replace(/\D/g, '')}`;
      const { error: otpError } = await sendOtp(normalizedPhone);
      if (otpError) throw otpError;

      // Set state for OTP verification
      setPhone(normalizedPhone);
      setIsOtpSent(true);
      setCountdown(30);
      setActiveTab('phone');
      
      toast({
        title: "Verification Required",
        description: "We've sent a code to your registered phone number",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: error.message || "Invalid credentials or phone mismatch",
      });
    } finally {
      setIsLoading(false);
    }
  };


  // Handle user sign-up
  const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  try {
    // Phone validation
    const phoneDigits = phone.replace(/\D/g, '');
    // Check if it's a valid US number (10 digits) or international (starts with +1)
    const isValidUSNumber = phoneDigits.length === 10;
    const isValidInternational = phone.startsWith('+1') && phoneDigits.length === 11;
    
    if (!isValidUSNumber && !isValidInternational) {
      throw new Error('Please enter a valid 10-digit US phone number or +1 international number');
    }

    // Create account
    const normalizedPhone = phone.startsWith('+1') ? phone : `+1${phoneDigits}`;

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { phone: normalizedPhone } }
    });
    if (signUpError) throw signUpError;
    if (!signUpData.user) throw new Error('User creation failed');

    // Store verification record
    const { error: verificationError } = await supabase
      .from('user_verifications')
      .upsert({
        user_id: signUpData.user.id,
        phone_number: normalizedPhone,
        phone_verified: false
      });
    if (verificationError) throw verificationError;

    // Send OTP
    const { error: otpError } = await sendOtp(normalizedPhone);
    if (otpError) throw otpError;

    // Switch to phone verification
    setActiveTab('phone');
    setJustSignedUp(true);
    setIsOtpSent(true);
    setCountdown(30);
    toast({
      title: "Account created!",
      description: "We've sent a verification code to your phone",
    });
  } catch (error: any) {
    let errorMessage = error.message;
    if (error.message.includes('User already registered')) {
      errorMessage = "This email is already registered. Please sign in.";
    } else if (error.message.includes('invalid phone number')) {
      errorMessage = "Please enter a valid phone number with country code";
    } else if (error.message.includes('Email rate limit exceeded')) {
      errorMessage = "Too many attempts. Please wait before trying again.";
    }
    toast({
      variant: "destructive",
      title: "Signup Failed",
      description: errorMessage || "Failed to create account"
    });
  } finally {
    setIsLoading(false);
  }
};

  // Handle OTP verification
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await verifyPhoneOtp(phone, otp);
      if (error) throw error;

      // Get user and update verification status
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      await supabase
        .from('user_verifications')
        .upsert({
          user_id: user.id,
          phone_number: phone,
          phone_verified: true
        });

      toast({
        title: "Verification Successful!",
        description: "Your phone number has been verified",
      });
      navigate('/');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.message || "Invalid verification code"
      });
    } finally {
      setIsLoading(false);
    }
  };


  // Handle Google authentication
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  

const validatePassword = (password: string) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return {
    isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
    requirements: [
      { met: password.length >= minLength, text: `At least ${minLength} characters` },
      { met: hasUpperCase, text: 'At least one uppercase letter' },
      { met: hasLowerCase, text: 'At least one lowercase letter' },
      { met: hasNumber, text: 'At least one number' },
      { met: hasSpecialChar, text: 'At least one special character' }
    ]
  };
};

 // Render OTP input fields
  const renderOtpInputs = () => {
    return (
      <div className="flex space-x-2 justify-center">
        {[...Array(6)].map((_, i) => (
          <Input
            key={i}
            type="text"
            maxLength={1}
            className="text-center h-12 w-12 text-lg"
            value={otp[i] || ''}
            onChange={(e) => {
              const newOtp = [...otp];
              newOtp[i] = e.target.value;
              setOtp(newOtp.join(''));
              
              // Auto-focus next input
              if (e.target.value && i < 5) {
                document.getElementById(`otp-${i+1}`)?.focus();
              }
            }}
            id={`otp-${i}`}
          />
        ))}
      </div>
    );
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md border-2 shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ShoppingBag className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Welcome to NovaMart</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to your account or create a new one
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs 
          defaultValue="signin"  
          value={activeTab}
          onValueChange={(value) => {
              setActiveTab(value);
              setJustSignedUp(false); 
              setIsOtpSent(false);
              setOtp('');
            }}           
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="magic">Magic Link</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>

            </TabsList>
            
             {/* Sign In Tab */}
            <TabsContent value="signin" className="space-y-4 mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-phone">Verify Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-phone"
                      type="tel"
                      placeholder="(+1) 234 567-8910"
                      value={signInPhone}
                      onChange={(e) => setSignInPhone(formatPhoneNumber(e.target.value))}
                      className="pl-10"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter the phone number you used during sign-up
                  </p>
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Sign In
                </Button>
              </form>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleGoogleAuth}
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>
            </TabsContent>

             {/* Sign Up Tab */}
            <TabsContent value="signup" className="space-y-4 mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    {validatePassword(password).requirements.map((req, i) => (
                      <p key={i} className={req.met ? 'text-green-500' : 'text-gray-500'}>
                        {req.met ? '✓' : '•'} {req.text}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
  id="signup-phone"
  type="tel"
  placeholder="+1 234 567 8910"
  value={phone}
  onChange={(e) => {
    // Allow manual +1 input
    if (e.target.value.startsWith('+1')) {
      setPhone(e.target.value);
    } else {
      setPhone(formatPhoneNumber(e.target.value));
    }
  }}
  className="pl-10"
  required
/>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We'll send a verification code to this number
                  </p>
                </div>
         <Button 
  type="submit" 
  className="w-full"
  disabled={
    isLoading || 
    !validatePassword(password).isValid || 
    (!phone.startsWith('+1') && phone.replace(/\D/g, '').length !== 10)
  }
>
  {isLoading ? (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  ) : null}
  Create Account
</Button>
              </form>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleGoogleAuth}
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign up with Google
              </Button>
            </TabsContent>

             {/* Magic Link Tab */}
            <TabsContent value="magic" className="space-y-4 mt-6">
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="magic-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="magic-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Send Magic Link
                </Button>
                <div className="text-center text-xs text-muted-foreground">
                  We'll send you a secure link to sign in without a password
                </div>
              </form>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleGoogleAuth}
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>
            </TabsContent>
             {/* Phone Verification Tab */}
            <TabsContent value="phone" className="space-y-4 mt-6">
              <AnimatePresence mode="wait">
                {justSignedUp && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-primary/10 p-3 rounded-md mb-4"
                  >
                    <p className="text-sm text-primary">
                      <User className="inline mr-2 h-4 w-4" />
                      Almost done! Verify your phone to complete registration.
                    </p>
                  </motion.div>
                )}

                {!isOtpSent ? (
                  <motion.div
                    key="phone-input"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(+1) 234 567-8910"
                          value={phone}
                          onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                          className="pl-10"
                          required
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        We'll send you a one-time verification code.
                        {justSignedUp && " This helps secure your new account."}
                      </p>
                    </div>
                    <Button 
                      type="button" 
                      className="w-full"
                      onClick={async () => {
                        setIsLoading(true);
                        const normalizedPhone = `+1${phone.replace(/\D/g, '')}`;
                        const { error } = await sendOtp(normalizedPhone);
                        setIsLoading(false);
                        
                        if (error) {
                          toast({
                            variant: "destructive",
                            title: "Error",
                            description: error.message,
                          });
                        } else {
                          setIsOtpSent(true);
                          setCountdown(30);
                          toast({
                            title: "Code Sent",
                            description: "Verification code sent to your phone",
                          });
                        }
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Send Verification Code
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="otp-input"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <form onSubmit={handleOtpSubmit}>
                      <div className="space-y-2">
                        <Label htmlFor="otp">Verification Code</Label>
                        {renderOtpInputs()}
                        <p className="text-xs text-muted-foreground">
                          Enter the 6-digit code sent to {phone}
                        </p>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full mt-4"
                        disabled={isLoading || otp.length !== 6}
                      >
                        {isLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Verify Phone Number
                      </Button>
                    </form>
                    
                    <div className="text-center text-sm">
                      {countdown > 0 ? (
                        <span className="text-muted-foreground">
                          Resend code in {countdown}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={async () => {
                            setCountdown(30);
                            const normalizedPhone = `+1${phone.replace(/\D/g, '')}`;
                            await sendOtp(normalizedPhone);
                          }}
                        >
                          Resend Code
                        </button>
                      )}
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      className="w-full text-sm"
                      onClick={() => {
                        setIsOtpSent(false);
                        setOtp('');
                      }}
                      disabled={isLoading}
                    >
                      Use a different phone number
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleGoogleAuth}
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}