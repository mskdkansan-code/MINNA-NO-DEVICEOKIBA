const profileForm =
  document.getElementById("profileForm");

const usernameInput =
  document.getElementById("username");

const twitterInput =
  document.getElementById("twitter");

const bioInput =
  document.getElementById("bio");

const avatarInput =
  document.getElementById("avatar");

const avatarPreview =
  document.getElementById("avatarPreview");

const mouseInput =
  document.getElementById("mouse");

const keyboardInput =
  document.getElementById("keyboard");

const mousepadInput =
  document.getElementById("mousepad");

const monitorInput =
  document.getElementById("monitor");

const audioInput =
  document.getElementById("audio");

const sensitivityInput =
  document.getElementById("sensitivity");

const mainGameInput =
  document.getElementById("main_game");

let currentProfile = null;

async function loadProfilePage() {

  const {
    data: { session },
  } =
    await window.supabaseClient
      .auth
      .getSession();

  const user =
    session?.user;

  if (!user) {
    alert("ログインしてください。");
    window.location.href = "./index.html";
    return;
  }

  currentProfile =
    await ensureProfile();

  usernameInput.value =
    currentProfile.username || "";

  twitterInput.value =
    currentProfile.twitter || "";

  bioInput.value =
    currentProfile.bio || "";

  mouseInput.value =
    currentProfile.mouse || "";

  keyboardInput.value =
    currentProfile.keyboard || "";

  mousepadInput.value =
    currentProfile.mousepad || "";

  monitorInput.value =
    currentProfile.monitor || "";

  audioInput.value =
    currentProfile.audio || "";

  sensitivityInput.value =
    currentProfile.sensitivity || "";

  mainGameInput.value =
    currentProfile.main_game || "";

  if (currentProfile.avatar_url) {
    avatarPreview.src =
      currentProfile.avatar_url;

    avatarPreview.style.display =
      "block";
  }
}

avatarInput.addEventListener("change", () => {

  const file =
    avatarInput.files[0];

  if (!file) {
    return;
  }

  avatarPreview.src =
    URL.createObjectURL(file);

  avatarPreview.style.display =
    "block";
});

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username =
    usernameInput.value.trim();

  if (!username) {
    alert("Usernameを入力してください。");
    return;
  }

  const {
    data: { session },
  } =
    await window.supabaseClient
      .auth
      .getSession();

  const user =
    session?.user;

  let avatarUrl =
    currentProfile?.avatar_url || null;

  const avatarFile =
    avatarInput.files[0];

  if (avatarFile) {

    const fileName =
      `${user.id}-${Date.now()}-${avatarFile.name}`;

    const { error: uploadError } =
      await window.supabaseClient
        .storage
        .from("profile-images")
        .upload(fileName, avatarFile);

    if (uploadError) {
      console.error(uploadError);
      alert("画像アップロードに失敗しました。");
      return;
    }

    const { data: avatarData } =
      window.supabaseClient
        .storage
        .from("profile-images")
        .getPublicUrl(fileName);

    avatarUrl =
      avatarData.publicUrl;
  }

  const { error } =
    await window.supabaseClient
      .from("profiles")
      .update({
        username: username,
        twitter: twitterInput.value.trim(),
        bio: bioInput.value.trim(),
        avatar_url: avatarUrl,
        mouse: mouseInput.value.trim(),
        keyboard: keyboardInput.value.trim(),
        mousepad: mousepadInput.value.trim(),
        monitor: monitorInput.value.trim(),
        audio: audioInput.value.trim(),
        sensitivity: sensitivityInput.value.trim(),
        main_game: mainGameInput.value.trim()
      })
      .eq("id", user.id);

  if (error) {
    console.error(error);
    alert("更新に失敗しました。");
    return;
  }

  alert("プロフィールを更新しました。");
  window.location.href = "./index.html";
});

loadProfilePage();