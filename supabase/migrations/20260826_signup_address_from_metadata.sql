-- La direccion pasa a ser obligatoria en el alta del beneficiario. Se guarda
-- aca y no con save_my_address porque el signUp no deja sesion abierta (el
-- email se confirma despues) y esa RPC necesita auth.uid().
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  final_user_role_id bigint;
  user_role_name text;
  v_terms_version text;
  v_privacy_version text;
  v_address jsonb;
  v_address_id bigint;
BEGIN
  user_role_name := NEW.raw_user_meta_data->>'role_name';
  IF user_role_name IS NULL OR user_role_name = 'final_user' THEN
    SELECT id INTO final_user_role_id FROM public.user_role WHERE name = 'final_user';
    IF final_user_role_id IS NOT NULL THEN
      v_terms_version := NEW.raw_user_meta_data->>'terms_version';
      v_privacy_version := NEW.raw_user_meta_data->>'privacy_version';

      v_address := NEW.raw_user_meta_data->'address';
      IF btrim(COALESCE(v_address->>'street', '')) <> '' THEN
        INSERT INTO public.address (
          street, number, city, state, zip_code,
          country, place_id, latitude, longitude
        ) VALUES (
          v_address->>'street',
          v_address->>'number',
          v_address->>'city',
          v_address->>'state',
          v_address->>'zip_code',
          v_address->>'country',
          v_address->>'place_id',
          (v_address->>'latitude')::double precision,
          (v_address->>'longitude')::double precision
        )
        RETURNING id INTO v_address_id;
      END IF;

      INSERT INTO public.beneficiary (
        auth_user_id, email, first_name, last_name, phone, document_id, role_id,
        terms_version, privacy_version, legal_accepted_at, marketing_opt_in,
        address_id
      ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'document_id',
        final_user_role_id,
        v_terms_version,
        v_privacy_version,
        -- La hora la pone el servidor, no el cliente: es una constancia legal.
        CASE WHEN v_terms_version IS NOT NULL THEN now() END,
        COALESCE((NEW.raw_user_meta_data->>'marketing_opt_in')::boolean, false),
        v_address_id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
