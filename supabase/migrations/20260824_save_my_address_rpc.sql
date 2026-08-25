-- Saving an address from the mobile profile failed with
-- "new row violates row-level security policy for table address".
--
-- The INSERT itself was never the whole problem: the client does
-- .insert().select().single(), and the RETURNING is checked against the
-- beneficiary SELECT policy, which only allows reading an address already
-- linked through beneficiary.address_id. You cannot link the row without
-- reading its id, and you cannot read it before it is linked -- RLS cannot
-- express that. So create + link happen together in one definer function.

CREATE OR REPLACE FUNCTION public.save_my_address(
  p_street     text,
  p_number     text,
  p_city       text,
  p_state      text,
  p_zip_code   text,
  p_country    text             DEFAULT NULL,
  p_place_id   text             DEFAULT NULL,
  p_latitude   double precision DEFAULT NULL,
  p_longitude  double precision DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_beneficiary_id bigint;
  v_address_id     bigint;
BEGIN
  SELECT id, address_id INTO v_beneficiary_id, v_address_id
  FROM beneficiary
  WHERE auth_user_id = auth.uid();

  IF v_beneficiary_id IS NULL THEN
    RAISE EXCEPTION 'No beneficiary for current user' USING ERRCODE = '42501';
  END IF;

  IF v_address_id IS NULL THEN
    INSERT INTO address (street, number, city, state, zip_code,
                         country, place_id, latitude, longitude)
    VALUES (p_street, p_number, p_city, p_state, p_zip_code,
            p_country, p_place_id, p_latitude, p_longitude)
    RETURNING id INTO v_address_id;

    UPDATE beneficiary SET address_id = v_address_id WHERE id = v_beneficiary_id;
  ELSE
    UPDATE address SET
      street    = p_street,
      number    = p_number,
      city      = p_city,
      state     = p_state,
      zip_code  = p_zip_code,
      country   = p_country,
      place_id  = p_place_id,
      latitude  = p_latitude,
      longitude = p_longitude
    WHERE id = v_address_id;
  END IF;

  RETURN v_address_id;
END;
$$;

-- Supabase's default privileges grant EXECUTE to anon explicitly, so revoking
-- from PUBLIC alone does not cover it.
REVOKE ALL ON FUNCTION public.save_my_address(text, text, text, text, text, text, text, double precision, double precision) FROM public;
REVOKE ALL ON FUNCTION public.save_my_address(text, text, text, text, text, text, text, double precision, double precision) FROM anon;
GRANT EXECUTE ON FUNCTION public.save_my_address(text, text, text, text, text, text, text, double precision, double precision) TO authenticated;

-- The direct-insert policy is no longer needed: the function above is the only
-- way a beneficiary creates an address, and it runs as definer.
DROP POLICY IF EXISTS "Beneficiaries can create addresses" ON address;
