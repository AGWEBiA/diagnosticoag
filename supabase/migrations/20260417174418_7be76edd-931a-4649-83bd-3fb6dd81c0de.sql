CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _matched_count int := 0;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Match retroativo: compras feitas antes do cadastro (sem user_id real, vinculadas só pelo email)
  -- são reatribuídas para o novo usuário.
  IF NEW.email IS NOT NULL THEN
    UPDATE public.creditos_diagnostico
    SET user_id = NEW.id
    WHERE lower(email_comprador) = lower(NEW.email)
      AND user_id = '00000000-0000-0000-0000-000000000000'::uuid
      AND diagnostico_id IS NULL;
    GET DIAGNOSTICS _matched_count = ROW_COUNT;
  END IF;

  -- Crédito de cortesia (estratégia de vendas — não exposto como "gratuito" na UI)
  -- Só concede se o usuário não recebeu créditos via match retroativo.
  IF _matched_count = 0 THEN
    INSERT INTO public.creditos_diagnostico (user_id, origem, email_comprador, metadata)
    VALUES (NEW.id, 'cortesia', NEW.email, jsonb_build_object('source','signup'));
  END IF;

  RETURN NEW;
END;
$function$;

-- Garante que o trigger existe (caso tenha sido removido)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();