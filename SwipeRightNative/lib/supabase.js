import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://uzaxgpylrkyecmpopbdm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6YXhncHlscmt5ZWNtcG9wYmRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNTA5NDIsImV4cCI6MjA5MjcyNjk0Mn0.w7m0XtxG9gEYVOuLWmCccsaZjqmlVwf9r_QXaLXe6U0';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
