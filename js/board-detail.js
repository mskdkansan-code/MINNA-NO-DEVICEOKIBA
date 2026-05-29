const params =
  new URLSearchParams(window.location.search);

const postId =
  params.get("id");

const boardDetail =
  document.getElementById("boardDetail");

const boardCommentForm =
  document.getElementById("boardCommentForm");

const boardCommentInput =
  document.getElementById("boardCommentInput");

const boardCommentsList =
  document.getElementById("boardCommentsList");

const boardDeleteArea =
  document.getElementById("boardDeleteArea");

async function getCurrentUser() {

  const {
    data: { session },
  } =
    await window.supabaseClient
      .auth
      .getSession();

  return session?.user;
}

async function getBoardCommentCount() {

  const { count, error } =
    await window.supabaseClient
      .from("board_comments")
      .select("*", {
        count: "exact",
        head: true
      })
      .eq("post_id", postId);

  if (error) {
    console.error(error);
    return 0;
  }

  return count || 0;
}

async function getBoardLikeInfo(user) {

  const { count } =
    await window.supabaseClient
      .from("board_likes")
      .select("*", {
        count: "exact",
        head: true
      })
      .eq("post_id", postId);

  let liked = false;

  if (user) {

    const { data: likeData } =
      await window.supabaseClient
        .from("board_likes")
        .select("*")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();

    liked = !!likeData;
  }

  return {
    likeCount: count || 0,
    liked: liked
  };
}

async function loadBoardPost() {

  if (!postId) {

    boardDetail.innerHTML = `
      <p class="empty-message">
        投稿が見つかりません。
      </p>
    `;

    return;
  }

  const user =
    await getCurrentUser();

  const { data, error } =
    await window.supabaseClient
      .from("board_posts")
      .select("*")
      .eq("id", postId)
      .single();

  if (error || !data) {

    console.error(error);

    boardDetail.innerHTML = `
      <p class="empty-message">
        投稿が見つかりません。
      </p>
    `;

    return;
  }

  const commentCount =
    await getBoardCommentCount();

  const {
    likeCount,
    liked
  } =
    await getBoardLikeInfo(user);

  boardDetail.innerHTML = `

    <article class="board-post detail-post">

      <div class="board-post-header">

        ${data.avatar_url
      ? `
            <img
              src="${data.avatar_url}"
              class="board-avatar"
              alt="${data.username}"
            >
          `
      : `
            <div class="board-avatar"></div>
          `
    }

        <div class="board-user-info">

          <span class="board-username">
            ${data.username}
          </span>

          <span class="board-date">
            ${new Date(data.created_at).toLocaleDateString("ja-JP")}
          </span>

        </div>

      </div>

      <span class="board-category">
        #${data.category}
      </span>

      <h2 class="board-title">
        ${data.title}
      </h2>

      <p class="board-content">
        ${data.content.replace(/\n/g, "<br>")}
      </p>

      ${data.image_url
      ? `
      <img
       src="${data.image_url}"
       class="board-detail-image"
       alt="board image"
      >
    `
        : ""
      }

      <div class="board-actions">

        <button
          id="likeButton"
          class="detail-like-button ${liked ? "liked" : ""}"
        >
          ♡ ${likeCount}
        </button>

        <span>
          💬 ${commentCount}
        </span>

      </div>

    </article>

  `;

  const likeButton =
    document.getElementById("likeButton");

  likeButton.addEventListener("click", async () => {

    if (!user) {
      alert("いいねするにはログインしてください。");
      return;
    }

    if (liked) {

      await window.supabaseClient
        .from("board_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

    } else {

      await window.supabaseClient
        .from("board_likes")
        .insert([
          {
            post_id: postId,
            user_id: user.id
          }
        ]);

    }

    loadBoardPost();

  });

  if (user && user.id === data.user_id) {

    boardDeleteArea.innerHTML = `

      <button
        id="deleteBoardButton"
        class="delete-button"
      >
        投稿を削除
      </button>

    `;

    const deleteButton =
      document.getElementById("deleteBoardButton");

    deleteButton.addEventListener("click", async () => {

      const confirmDelete =
        confirm("この投稿を削除しますか？");

      if (!confirmDelete) {
        return;
      }

      const { error } =
        await window.supabaseClient
          .from("board_posts")
          .delete()
          .eq("id", postId);

      if (error) {
        console.error(error);
        alert("削除に失敗しました。");
        return;
      }

      alert("投稿を削除しました。");

      window.location.href =
        "./board.html";

    });

  } else {
    boardDeleteArea.innerHTML = "";
  }
}

async function loadBoardComments() {

  const user =
    await getCurrentUser();

  const { data, error } =
    await window.supabaseClient
      .from("board_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", {
        ascending: false
      });

  if (error) {
    console.error(error);
    return;
  }

  if (data.length === 0) {

    boardCommentsList.innerHTML = `
      <p class="empty-comment">
        まだコメントはありません。
      </p>
    `;

    return;
  }

  boardCommentsList.innerHTML =
    data.map((comment) => {

      return `

        <div class="comment-card" id="comment-${comment.id}">

          <div class="comment-top">

            ${comment.avatar_url
          ? `
                <img
                  src="${comment.avatar_url}"
                  class="comment-avatar"
                  alt="${comment.username}"
                >
              `
          : `
                <div class="comment-avatar"></div>
              `
        }

            <div class="comment-user-info">

              <div class="comment-user-row">

                <p class="comment-user">
                  ${comment.username}
                </p>

                <button
                  class="comment-reply-button"
                  data-reply-username="${comment.username}"
                >
                  Reply
                </button>

                ${comment.user_id === user?.id
          ? `
                    <button
                      class="comment-delete-button"
                      data-comment-id="${comment.id}"
                    >
                      Delete
                    </button>
                  `
          : ""
        }

              </div>

              <p class="comment-date">
                ${new Date(comment.created_at).toLocaleDateString("ja-JP")}
              </p>

            </div>

          </div>

          <p class="comment-content">
            ${comment.content
          .replace(
            /@([a-zA-Z0-9_]+)/g,
            '<span class="comment-mention" data-mention="$1">@$1</span>'
          )
          .replace(/\n/g, "<br>")
        }
          </p>

        </div>

      `;

    }).join("");

  const deleteButtons =
    document.querySelectorAll(".comment-delete-button");

  deleteButtons.forEach((button) => {

    button.addEventListener("click", async () => {

      const commentId =
        button.dataset.commentId;

      const confirmDelete =
        confirm("このコメントを削除しますか？");

      if (!confirmDelete) {
        return;
      }

      const { error } =
        await window.supabaseClient
          .from("board_comments")
          .delete()
          .eq("id", commentId);

      if (error) {
        console.error(error);
        alert("コメント削除に失敗しました。");
        return;
      }

      alert("コメントを削除しました。");

      await loadBoardPost();

      await loadBoardComments();

    });

  });

  const replyButtons =
    document.querySelectorAll(".comment-reply-button");

  replyButtons.forEach((button) => {

    button.addEventListener("click", () => {

      const username =
        button.dataset.replyUsername;

      const replyText =
        `@${username} `;

      if (boardCommentInput.value.trim()) {

        boardCommentInput.value =
          `${boardCommentInput.value.trim()}\n${replyText}`;

      } else {

        boardCommentInput.value =
          replyText;

      }

      boardCommentInput.focus();

    });

  });

  const mentions =
    document.querySelectorAll(".comment-mention");

  mentions.forEach((mention) => {

    mention.addEventListener("click", () => {

      const username =
        mention.dataset.mention;

      const targetComment =
        [...document.querySelectorAll(".comment-card")]
          .find((card) => {

            const userElement =
              card.querySelector(".comment-user");

            return (
              userElement?.textContent.trim()
              === username
            );

          });

      if (targetComment) {

        targetComment.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });

        targetComment.classList.add("mention-highlight");

        setTimeout(() => {

          targetComment.classList.remove(
            "mention-highlight"
          );

        }, 1600);

      }

    });

  });

}

boardCommentForm.addEventListener("submit", async (e) => {

  e.preventDefault();

  const user =
    await getCurrentUser();

  if (!user) {
    alert("コメントするにはログインしてください。");
    return;
  }

  const content =
    boardCommentInput.value.trim();

  if (!content) {
    alert("コメントを入力してください。");
    return;
  }

  const profile =
    await ensureProfile();

  const { error } =
    await window.supabaseClient
      .from("board_comments")
      .insert([
        {
          post_id: postId,
          user_id: user.id,
          username: profile.username,
          avatar_url: profile.avatar_url || null,
          content: content
        }
      ]);

  if (error) {
    console.error(error);
    alert("コメント投稿に失敗しました。");
    return;
  }

  alert("コメントしました！");

  boardCommentInput.value = "";

  await loadBoardPost();

  await loadBoardComments();

});

loadBoardPost();

loadBoardComments();