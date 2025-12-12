import { createClient } from '@supabase/supabase-js';

// Credentials provided by user
const supabaseUrl = 'https://kkxctrkhxopmhoegnmcc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtreGN0cmtoeG9wbWhvZWdubWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMjA0NTUsImV4cCI6MjA4MDY5NjQ1NX0.pBaNQl9Evs95H2z8FhMP1t7zOD3Uj-TRW12Fy7ZAhgI';

export const supabase = createClient(supabaseUrl, supabaseKey);