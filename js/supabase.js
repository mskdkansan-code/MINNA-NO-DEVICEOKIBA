const supabaseUrl =
  "https://zfodilmaobkwmujiqkbe.supabase.co";

const supabaseKey =
  "sb_publishable_wV_VnY4HyeNcBw57avaEUw_D1Yph8u0";

window.supabaseClient =
  supabase.createClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );

const loginButton =
  document.getElementById("loginButton");

const logoutButton =
  document.getElementById("logoutButton");

const userInfo =
  document.getElementById("userInfo");

async function updateAuthUI(){

  const {
    data: { session },
  } =
  await window.supabaseClient
    .auth
    .getSession();

  const user =
    session?.user;

  if(user){

    const profile =
      await ensureProfile();

    if(userInfo){

      userInfo.innerHTML = `

        ${
          profile?.avatar_url
          ? `
            <img
              src="${profile.avatar_url}"
              class="nav-avatar"
              alt="profile icon"
            >
          `
          : ""
        }

        <span>
          ${profile?.username || user.email}
        </span>

      `;

    }

    if(loginButton){
      loginButton.style.display = "none";
    }

    if(logoutButton){
      logoutButton.style.display = "inline-block";
    }

  } else {

    if(userInfo){
      userInfo.textContent = "";
    }

    if(loginButton){
      loginButton.style.display = "inline-block";
    }

    if(logoutButton){
      logoutButton.style.display = "none";
    }

  }
}

if(loginButton){

  loginButton.addEventListener("click", async () => {

    const { error } =
      await window.supabaseClient
        .auth
        .signInWithOAuth({
          provider: "google",
          options: {
            redirectTo:
              "http://127.0.0.1:5500/index.html",
          },
        });

    if(error){
      console.error(error);
      alert("ログインに失敗しました。");
    }

  });

}

if(logoutButton){

  logoutButton.addEventListener("click", async () => {

    await window.supabaseClient
      .auth
      .signOut();

    await updateAuthUI();

  });

}

window.supabaseClient
  .auth
  .onAuthStateChange(() => {
    updateAuthUI();
  });

updateAuthUI();