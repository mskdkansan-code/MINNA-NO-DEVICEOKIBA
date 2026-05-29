const boardList =
  document.getElementById("boardList");

const boardFilterButtons =
  document.querySelectorAll(".board-filter-buttons button");

const boardSearchInput =
  document.getElementById("boardSearchInput");

const deviceRankingList =
  document.getElementById("deviceRankingList");

const deviceNameMap = {

  /*Mouse*/

  "gproxsuperlight2": "G PRO X SUPERLIGHT 2",
  "gpx2": "G PRO X SUPERLIGHT 2",

  "viperv3pro": "Viper V3 Pro",
  "vv3pro": "Viper V3 Pro",

  /*Keyboard*/

  "wooting60he": "Wooting 60HE",
  "wooting60hev2": "Wooting 60HE v2",

  /*Mousepad*/

  "artisanzero": "ARTISAN Zero",
};

let allBoardPosts = [];

async function getCommentCount(postId) {

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

async function getLikeCount(postId) {

  const { count, error } =
    await window.supabaseClient
      .from("board_likes")
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

async function displayBoardPosts(items) {

  if (items.length === 0) {

    boardList.innerHTML = `
      <p class="empty-message">
        投稿がありません。
      </p>
    `;

    return;
  }

  const postsHtml =
    await Promise.all(
      items.map(async (post) => {

        const commentCount =
          await getCommentCount(post.id);

        const likeCount =
          await getLikeCount(post.id);

        return `

          <a
            href="./board-detail.html?id=${post.id}"
            class="board-post-link"
          >

            <article class="board-post">

              <div class="board-post-header">

                ${post.avatar_url
            ? `
                    <img
                      src="${post.avatar_url}"
                      class="board-avatar"
                      alt="${post.username}"
                    >
                  `
            : `
                    <div class="board-avatar"></div>
                  `
          }

                <div class="board-user-info">

                  <span class="board-username">
                    ${post.username}
                  </span>

                  <span class="board-date">
                    ${new Date(post.created_at).toLocaleDateString("ja-JP")}
                  </span>

                </div>

              </div>

              <span class="board-category">
                #${post.category}
              </span>

              <h3 class="board-title">
                ${post.title}
              </h3>

              <p class="board-content">
                ${post.content.replace(/\n/g, "<br>")}
              </p>

              ${post.image_url
            ? `
                <img
                  src="${post.image_url}"
                  class="board-post-image"
                  alt="board image"
                >
              `
            : ""
          }

              <div class="board-actions">

                <span>
                  ♡ ${likeCount}
                </span>

                <span>
                  💬 ${commentCount}
                </span>

              </div>

            </article>

          </a>

        `;

      })
    );

  boardList.innerHTML =
    postsHtml.join("");
}

function applyBoardFilter() {

  const keyword =
    boardSearchInput.value.toLowerCase();

  const activeButton =
    document.querySelector(
      ".board-filter-buttons button.active"
    );

  const activeCategory =
    activeButton
      ? activeButton.dataset.category
      : "All";

  const filteredPosts =
    allBoardPosts.filter((post) => {

      const matchesKeyword =
        post.title.toLowerCase().includes(keyword)
        ||
        post.content.toLowerCase().includes(keyword)
        ||
        post.username.toLowerCase().includes(keyword)
        ||
        post.category.toLowerCase().includes(keyword);

      const matchesCategory =
        activeCategory === "All"
        ||
        post.category === activeCategory;

      return matchesKeyword && matchesCategory;

    });

  displayBoardPosts(filteredPosts);
}

async function loadBoardPosts() {

  boardList.innerHTML = `
    <p class="empty-message">
      掲示板を読み込み中...
    </p>
  `;

  const { data, error } =
    await window.supabaseClient
      .from("board_posts")
      .select("*")
      .order("created_at", {
        ascending: false
      });

  if (error) {
    console.error(error);

    boardList.innerHTML = `
      <p class="empty-message">
        読み込みに失敗しました。
      </p>
    `;

    return;
  }

  allBoardPosts =
    data || [];

  displayBoardPosts(allBoardPosts);
}

boardSearchInput.addEventListener("input", () => {
  applyBoardFilter();
});

function normalizeDeviceName(name) {

  const normalized =
    name
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/-/g, "")
      .replace(/_/g, "");

  return deviceNameMap[normalized] || name.trim();

}

function countDevices(profiles, key) {

  const counts = {};

  profiles.forEach((profile) => {

    const rawValue =
      profile[key]?.trim();

    if (!rawValue) {
      return;
    }

    const displayName =
      normalizeDeviceName(rawValue);

    counts[displayName] =
      (counts[displayName] || 0) + 1;

  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
}

async function loadDeviceRanking() {

  const { data, error } =
    await window.supabaseClient
      .from("profiles")
      .select("mouse, keyboard, mousepad, monitor");

  if (error) {
    console.error(error);
    deviceRankingList.innerHTML = `
      <p class="empty-message">
        読み込みに失敗しました。
      </p>
    `;
    return;
  }

  const rankingGroups = [
    {
      label: "Mouse",
      key: "mouse"
    },
    {
      label: "Keyboard",
      key: "keyboard"
    },
    {
      label: "Mousepad",
      key: "mousepad"
    }
  ];

  deviceRankingList.innerHTML =
    rankingGroups.map((group) => {

      const ranking =
        countDevices(data, group.key);

      return `

        <div class="ranking-group">

          <h4>
            ${group.label}
          </h4>

          ${ranking.length
          ? ranking.map(([name, count], index) => {

            return `
                  <div class="ranking-item">

                    <span class="ranking-rank">
                      ${index + 1}
                    </span>

                    <span class="ranking-name">
                      ${name}
                    </span>

                    <span class="ranking-count">
                      ${count}
                    </span>

                  </div>
                `;

          }).join("")
          : `
              <p class="ranking-empty">
                データなし
              </p>
            `
        }

        </div>

      `;

    }).join("");

}

boardFilterButtons.forEach((button) => {

  button.addEventListener("click", () => {

    boardFilterButtons.forEach((btn) => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    applyBoardFilter();

  });

});

loadBoardPosts();

loadDeviceRanking();