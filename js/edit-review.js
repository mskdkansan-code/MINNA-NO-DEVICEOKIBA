const params =
  new URLSearchParams(window.location.search);

const reviewId =
  params.get("id");

const editForm =
  document.getElementById("editForm");

const titleInput =
  document.getElementById("title");

const categoryInput =
  document.getElementById("category");

const priceInput =
  document.getElementById("price");

const productUrlInput =
  document.getElementById("product_url");

const descriptionInput =
  document.getElementById("description");

const ratingInput =
  document.getElementById("rating");

async function loadReview(){

  const {
    data: { session },
  } =
  await window.supabaseClient
    .auth
    .getSession();

  const user = session?.user;

  if(!user){
    alert("ログインしてください。");
    window.location.href = "./index.html";
    return;
  }

  const { data, error } =
    await window.supabaseClient
      .from("reviews")
      .select("*")
      .eq("id", reviewId)
      .single();

  if(error || !data){
    alert("レビューが見つかりません。");
    window.location.href = "./index.html";
    return;
  }

  if(data.user_id !== user.id){
    alert("このレビューは編集できません。");
    window.location.href = "./index.html";
    return;
  }

  titleInput.value = data.title;
  categoryInput.value = data.category;
  priceInput.value = data.price || "";
  productUrlInput.value = data.product_url || "";
  descriptionInput.value = data.description;
  ratingInput.value = data.rating;
}

editForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const saveButton =
    document.getElementById("saveButton");

  saveButton.disabled = true;
  saveButton.textContent = "Saving...";

  const updatedReview = {
    title: titleInput.value.trim(),
    category: categoryInput.value,
    price: priceInput.value.trim(),
    product_url: productUrlInput.value.trim(),
    description: descriptionInput.value.trim(),
    rating: Number(ratingInput.value),
  };

  if(
    !updatedReview.title ||
    !updatedReview.description ||
    !updatedReview.rating
  ){
    alert("必須項目を入力してください。");

    saveButton.disabled = false;
    saveButton.textContent = "Save Changes";

    return;
  }

  if(updatedReview.rating < 1 || updatedReview.rating > 5){
    alert("評価は1〜5で入力してください。");

    saveButton.disabled = false;
    saveButton.textContent = "Save Changes";

    return;
  }

  const { error } =
    await window.supabaseClient
      .from("reviews")
      .update(updatedReview)
      .eq("id", reviewId);

  if(error){
    console.error(error);
    alert("更新に失敗しました。");

    saveButton.disabled = false;
    saveButton.textContent = "Save Changes";

    return;
  }

  saveButton.textContent = "Saved!";

  alert("レビューを更新しました。");

  window.location.href =
    `./review.html?id=${reviewId}`;
});

loadReview();