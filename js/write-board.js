const boardForm =
  document.getElementById("boardForm");

const titleInput =
  document.getElementById("title");

const categoryInput =
  document.getElementById("category");

const contentInput =
  document.getElementById("content");

const boardImageInput =
  document.getElementById("boardImage");

const boardImagePreview =
  document.getElementById("boardImagePreview");

boardImageInput.addEventListener("change", () => {

  const file =
    boardImageInput.files[0];

  if (!file) {
    boardImagePreview.style.display = "none";
    boardImagePreview.src = "";
    return;
  }

  boardImagePreview.src =
    URL.createObjectURL(file);

  boardImagePreview.style.display =
    "block";

});

boardForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const {
    data: { session },
  } =
    await window.supabaseClient
      .auth
      .getSession();

  const user =
    session?.user;

  if (!user) {
    alert("投稿するにはログインしてください。");
    return;
  }

  const title =
    titleInput.value.trim();

  const category =
    categoryInput.value;

  const content =
    contentInput.value.trim();

  const imageFile =
    boardImageInput.files[0];

  let imageUrl =
    null;

  if (imageFile) {

    const fileName =
      `${user.id}-${Date.now()}-${imageFile.name}`;

    const { error: uploadError } =
      await window.supabaseClient
        .storage
        .from("board-images")
        .upload(fileName, imageFile);

    if (uploadError) {
      console.error(uploadError);
      alert("画像アップロードに失敗しました。");
      return;
    }

    const { data: imageData } =
      window.supabaseClient
        .storage
        .from("board-images")
        .getPublicUrl(fileName);

    imageUrl =
      imageData.publicUrl;
  }

  if (!title || !content) {
    alert("タイトルと内容を入力してください。");
    return;
  }

  const profile =
    await ensureProfile();

  const { error } =
    await window.supabaseClient
      .from("board_posts")
      .insert([
        {
          user_id: user.id,
          username: profile.username,
          avatar_url: profile.avatar_url || null,
          title: title,
          category: category,
          content: content,
          image_url: imageUrl,
        }
      ]);

  if (error) {
    console.error(error);
    alert("投稿に失敗しました。");
    return;
  }

  alert("投稿しました。");

  window.location.href =
    "./board.html";
});