async function ensureProfile(){

  const {
    data: { session },
  } =
  await window.supabaseClient
    .auth
    .getSession();

  const user =
    session?.user;

  if(!user){
    return;
  }

  const { data: profile } =
    await window.supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

  if(profile){
    return profile;
  }

  const defaultUsername =
    user.user_metadata.full_name
    || user.email
    || "user";

  const { data: newProfile, error } =
    await window.supabaseClient
      .from("profiles")
      .insert([
        {
          id: user.id,
          username: defaultUsername
        }
      ])
      .select()
      .single();

  if(error){
    console.error(error);
    return;
  }

  return newProfile;
}