
-- Onboarding status enum
CREATE TYPE public.onboarding_status AS ENUM ('not_started', 'in_progress', 'submitted', 'approved', 'rejected');

-- Vehicle type enum
CREATE TYPE public.vehicle_type AS ENUM ('bike', 'scooter', 'car', 'van', 'truck');

CREATE TABLE public.driver_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  license_number TEXT,
  license_expiry DATE,
  license_front_path TEXT,
  license_back_path TEXT,
  vehicle_type public.vehicle_type,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year INT,
  vehicle_plate TEXT,
  vehicle_registration_path TEXT,
  insurance_path TEXT,
  profile_photo_path TEXT,
  preferred_areas TEXT[] NOT NULL DEFAULT '{}',
  status public.onboarding_status NOT NULL DEFAULT 'not_started',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Driver can view own driver profile"
  ON public.driver_profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

CREATE POLICY "Driver can insert own driver profile"
  ON public.driver_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Driver can update own driver profile"
  ON public.driver_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER driver_profiles_touch
  BEFORE UPDATE ON public.driver_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-documents', 'driver-documents', false);

CREATE POLICY "Drivers read own documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Drivers upload own documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Drivers update own documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Drivers delete own documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
