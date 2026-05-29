const params =
  new URLSearchParams(window.location.search);

const reviewId =
  params.get("id");

const reviewDetail =
  document.getElementById("reviewDetail");

const likeArea =
  document.getElementById("likeArea");

const deleteArea =
  document.getElementById("deleteArea");

const commentForm =
  document.getElementById("commentForm");

const commentInput =
  document.getElementById("commentInput");

const commentsList =
  document.getElementById("commentsList");

async function loadComments(){

  const { data, error } =
    await window.supabaseClient
      .from("comments")
      .select("*")
      .eq("review_id", reviewId)
      .order("created_at", {
        ascending:false
      });

  if(error){
    console.error(error);
    return;
  }

  if(data.length === 0){
    commentsList.innerHTML = `
      <p class="empty-comment">
        まだコメントはありません。
      </p>
    `;
    return;
  }

  commentsList.innerHTML =
    data.map((comment) => {

      return `
        <div class="comment-card">

          <p class="comment-user">
            ${comment.username}
          </p>

          <p class="comment-content">
            ${comment.content}
          </p>

          <p class="comment-date">
            ${new Date(comment.created_at).toLocaleDateString("ja-JP")}
          </p>

        </div>
      `;

    }).join("");

}

async function loadReview(){

  if(!reviewId){
    reviewDetail.innerHTML =
      "<p>レビューが見つかりません。</p>";
    return;
  }

  const { data, error } =
    await window.supabaseClient
      .from("reviews")
      .select("*")
      .eq("id", reviewId)
      .single();

  if(error || !data){
    console.error(error);
    reviewDetail.innerHTML =
      "<p>レビューが見つかりません。</p>";
    return;
  }

  await window.supabaseClient
    .from("reviews")
    .update({
      views:(data.views || 0) + 1
    })
    .eq("id", reviewId);

  data.views =
    (data.views || 0) + 1;

  let {
    count: likeCount
  } =
  await window.supabaseClient
    .from("likes")
    .select("*", {
      count:"exact",
      head:true
    })
    .eq("review_id", reviewId);

  const {
    data: { user },
  } =
  await window.supabaseClient
    .auth
    .getUser();

  let userLiked = false;

  if(user){

    const { data: existingLike } =
      await window.supabaseClient
        .from("likes")
        .select("*")
        .eq("review_id", reviewId)
        .eq("user_id", user.id)
        .maybeSingle();

    userLiked = !!existingLike;
  }

  const ratingStars =
    Array.from({ length: 5 }, (_, index) => {
      return index < Math.round(data.rating)
        ? '<span class="star active">★</span>'
        : '<span class="star">★</span>';
    }).join("");

  reviewDetail.innerHTML = `
    <div class="review-detail-card">

      <div class="review-detail-top">

        <div class="review-detail-image-wrap">
          <img src="${data.image}" alt="${data.title}">
        </div>

        <div class="review-detail-info">

          <span class="category">
            ${data.category}
          </span>

          <h2>
            ${data.title}
          </h2>

          <div class="review-stats">

            <div class="stat-box">
              <span class="stat-label">Rating</span>

              <div class="rating">
                <div class="rating-stars">
                  ${ratingStars}
                </div>

                <span class="rating-number">
                  ${data.rating}
                </span>
              </div>
            </div>

            <div class="stat-box">
              <span class="stat-label">Price</span>

              <p class="price">
                ¥${data.price}
              </p>
            </div>

          </div>

          <a
            href="./user.html?username=${data.username}"
            class="posted-by-link"
          >
          Posted by ${data.username}
          </a>

          <p class="posted-date">
            ${new Date(data.created_at).toLocaleDateString("ja-JP")}
          </p>

          <div class="detail-social-row">

            <span class="detail-view-count">
              ◉ ${data.views || 0}
            </span>

            <button
              class="detail-like-button ${
                userLiked ? "liked" : ""
              }"
              id="likeButton"
            >
              ♡ ${likeCount || 0}
            </button>

          </div>

          <a
            href="${data.product_url}"
            target="_blank"
            class="product-link"
          >
            商品ページを見る
          </a>

        </div>

      </div>

      <div class="review-detail-bottom">

        <h3>
          Review
        </h3>

        <p class="review-text">
          ${data.description}
        </p>

      </div>

    </div>
  `;

  if(user && user.id === data.user_id){

    deleteArea.innerHTML = `
      <a
        href="./edit-review.html?id=${data.id}"
        class="edit-button"
      >
        Edit Review
      </a>

      <button
        class="delete-button"
        id="deleteButton"
      >
        Delete Review
      </button>
    `;

    const deleteButton =
      document.getElementById("deleteButton");

    deleteButton.addEventListener("click", async () => {

      const confirmDelete =
        confirm("本当に削除しますか？");

      if(!confirmDelete){
        return;
      }

      const { error } =
        await window.supabaseClient
          .from("reviews")
          .delete()
          .eq("id", reviewId);

      if(error){
        console.error(error);
        alert("削除に失敗しました。");
        return;
      }

      alert("レビューを削除しました。");
      window.location.href = "./index.html";
    });

  } else {
    deleteArea.innerHTML = "";
  }

  const likeButton =
    document.getElementById("likeButton");

  likeButton.addEventListener("click", async () => {

    if(!user){
      alert("ログインしてください。");
      return;
    }

    if(userLiked){

      await window.supabaseClient
        .from("likes")
        .delete()
        .eq("review_id", reviewId)
        .eq("user_id", user.id);

      userLiked = false;
      likeButton.classList.remove("liked");
      likeCount--;

    } else {

      await window.supabaseClient
        .from("likes")
        .insert([
          {
            review_id: reviewId,
            user_id: user.id
          }
        ]);

      userLiked = true;
      likeButton.classList.add("liked");
      likeCount++;

    }

    likeButton.innerHTML =
      `♡ ${likeCount}`;

  });

}

commentForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const {
    data: { session },
  } =
  await window.supabaseClient
    .auth
    .getSession();

  const user =
    session?.user;

  if(!user){
    alert("コメントするにはログインしてください。");
    return;
  }

  const content =
    commentInput.value.trim();

  if(!content){
    alert("コメントを入力してください。");
    return;
  }

  const { error } =
    await window.supabaseClient
      .from("comments")
      .insert([
        {
          review_id: reviewId,
          user_id: user.id,
          username:
            user.user_metadata.full_name
            || user.email,
          content: content
        }
      ]);

  if(error){
    console.error(error);
    alert("コメント投稿に失敗しました。");
    return;
  }

  commentInput.value = "";

  loadComments();
});

loadComments();

loadReview();