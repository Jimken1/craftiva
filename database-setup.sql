-- Database setup for Craftiva Job Request System
-- Run this in your Supabase SQL editor

-- Create job_requests table
CREATE TABLE IF NOT EXISTS job_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    budget_min INTEGER NOT NULL,
    budget_max INTEGER NOT NULL,
    skills_required TEXT[] DEFAULT '{}',
    location TEXT,
    deadline DATE NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
    assigned_apprentice_id UUID REFERENCES profiles(id),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_applications table
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    apprentice_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    job_request_id UUID REFERENCES job_requests(id) ON DELETE CASCADE,
    proposal TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(apprentice_id, job_request_id)
);

-- Create referral_codes table for unique invite links
CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    total_referrals INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referrals table to track successful referrals
CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    referral_code_id UUID REFERENCES referral_codes(id) ON DELETE CASCADE,
    points_awarded INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referred_user_id) -- Each user can only be referred once
);

-- Add columns to profiles table if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_earnings INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS completed_jobs INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code_id UUID REFERENCES referral_codes(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_requests_client_id ON job_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_job_requests_status ON job_requests(status);
CREATE INDEX IF NOT EXISTS idx_job_requests_assigned_apprentice_id ON job_requests(assigned_apprentice_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_apprentice_id ON job_applications(apprentice_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_request_id ON job_applications(job_request_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE job_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for job_requests
CREATE POLICY "Users can view all open job requests" ON job_requests
    FOR SELECT USING (status = 'open');

CREATE POLICY "Users can view their own job requests" ON job_requests
    FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Users can view jobs they are assigned to" ON job_requests
    FOR SELECT USING (auth.uid() = assigned_apprentice_id);

CREATE POLICY "Users can create job requests" ON job_requests
    FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update their own job requests" ON job_requests
    FOR UPDATE USING (auth.uid() = client_id);

CREATE POLICY "Assigned apprentices can update job progress" ON job_requests
    FOR UPDATE USING (auth.uid() = assigned_apprentice_id);

-- Create RLS policies for job_applications
CREATE POLICY "Users can view their own applications" ON job_applications
    FOR SELECT USING (auth.uid() = apprentice_id);

CREATE POLICY "Job owners can view applications for their jobs" ON job_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM job_requests 
            WHERE job_requests.id = job_applications.job_request_id 
            AND job_requests.client_id = auth.uid()
        )
    );

CREATE POLICY "Users can create applications" ON job_applications
    FOR INSERT WITH CHECK (auth.uid() = apprentice_id);

CREATE POLICY "Job owners can update application status" ON job_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM job_requests 
            WHERE job_requests.id = job_applications.job_request_id 
            AND job_requests.client_id = auth.uid()
        )
    );

-- Create RLS policies for referral_codes
CREATE POLICY "Users can view their own referral codes" ON referral_codes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral codes" ON referral_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral codes" ON referral_codes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active referral codes" ON referral_codes
    FOR SELECT USING (is_active = true);

-- Create RLS policies for referrals
CREATE POLICY "Users can view referrals they made" ON referrals
    FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals made to them" ON referrals
    FOR SELECT USING (auth.uid() = referred_user_id);

CREATE POLICY "System can create referrals" ON referrals
    FOR INSERT WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_job_requests_updated_at 
    BEFORE UPDATE ON job_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at 
    BEFORE UPDATE ON job_applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_codes_updated_at 
    BEFORE UPDATE ON referral_codes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists_already BOOLEAN;
BEGIN
    LOOP
        -- Generate a 8-character alphanumeric code
        code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM referral_codes WHERE referral_codes.code = code) INTO exists_already;
        
        -- If code doesn't exist, return it
        IF NOT exists_already THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create function to award referral points
CREATE OR REPLACE FUNCTION award_referral_points(referrer_user_id UUID, referred_user_id UUID, referral_code_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Insert referral record
    INSERT INTO referrals (referrer_id, referred_user_id, referral_code_id, points_awarded)
    VALUES (referrer_user_id, referred_user_id, referral_code_id, 100);
    
    -- Update referrer's referral points
    UPDATE profiles 
    SET referral_points = COALESCE(referral_points, 0) + 100,
        referrals = COALESCE(referrals, 0) + 1,
        updated_at = NOW()
    WHERE id = referrer_user_id;
    
    -- Update referral code usage count
    UPDATE referral_codes 
    SET total_referrals = total_referrals + 1,
        updated_at = NOW()
    WHERE id = referral_code_id;
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql;

